#include "protocol.hpp"
#include "utils.hpp"
#include "messages.hpp"

using namespace uahruart;

Instance::Instance(void(*send_bytes)(char* bytes, const unsigned int len))
    : send_bytes(send_bytes) {

    // Setup state machine
    current_state = States::READING_HEADER;
}

// ---------------
// MAIN PROTOCOL IMPLEMENTATION

/*
This is the main protocol implememtation, so the explanation of the protocol will be here
*/
void Instance::parse_byte(char b) {
    // Update the ring buffer
    *current_position++ = b; // Store character received and update the pointer (next position)
    // If the position is outside the bounds of the array wrap around
    current_position = ((current_position - ring_buffer) % Instance::BUFFER_LENGTH + ring_buffer);
    total_read++;

    // State machine implementation
    switch (current_state) {
         /*
        Read trailing zeroes
        The trailing zeroes are there to account for possible byte loss on the body of the message
        */
        case States::READING_TRAILING: {
            if (b == '\0')
                break;
            else
                current_state = States::READING_HEADER;
            // In case that it's not zero, the program parses the byte as the next header
            // so no break statement its present
        }
        /*
        Read the header of the packet (allways the same size)
        */
        case States::READING_HEADER: {
            // It there are enough values for the header store it
            if (total_read >= sizeof(uahruart::messages::Header)) {
                copy_from_buffer(tmp_pkt, sizeof(uahruart::messages::Header));

                // Check if it's special kind of message
                if (tmp_pkt->header.type == 255) { // Check for debug message
                    current_state = READING_DEBUG;
                    reset_buffer();
                    break;
                }
                // END of special messages check

                current_state = READING_PACKET;
                reset_buffer();
            }
            break;
        }
        /*
        Reads the content of the packet
        */
        case States::READING_PACKET: {
            // Checking if it's on recovery mode
            if (recovering_state != RecoveringState::NOT_RECOVERING) {
                switch (recovering_state) {
                    /*
                    Waiting for the recovery ACK
                    */
                    /*case RecoveringState::WAITING_FOR_RECOVER_ACK: {

                        break;
                    }*/ /** TODO: Finish the error handling protocol */
                }
            }

            // GET NORMAL COMMAND
            // Get length of packet and check if it's inside the bounds of the defined types
            if (tmp_pkt->header.type >= (unsigned int)messages::PacketTypes::COUNT) {
                reset_buffer();
                send_error_message();
                current_state = States::READING_HEADER;
            } else { // Message type exists
                // Read body (size of struct minus the header)
                unsigned int body_length = messages::size_by_pkt_type[tmp_pkt->header.type] - sizeof(uahruart::messages::Header);
                if (total_read >= body_length) { // If there are enough bytes
                    // Copy body to temp message
                    copy_from_buffer(((char*)tmp_pkt) + sizeof(uahruart::messages::Header), body_length);

                    // -- DEBUG --
                    std::cout << "\nReceived packet header info:\n";
                    std::cout << "Type: " << tmp_pkt->header.type << '\n';
                    std::cout << "Checksum: " << tmp_pkt->header.checksum << '\n';
                    std::cout << "Sequence number: " << tmp_pkt->header.sequence_num << '\n';


                    // Checksum comprobation
                    uint32_t calculated_checksum = tmp_pkt->get_calculated_checksum();
                    if (calculated_checksum != tmp_pkt->header.checksum) { // Checksum failed
                        send_error_message();
                    }

                    // ACK number comprobation
                    if (tmp_pkt->header.sequence_num < _ack_number) {
                      // Check message type (if it's an adminstration message)
                      if (tmp_pkt->header.type == (uint32_t)messages::PacketTypes::ADMIN) {
                        // Interpret protocol administration packets
                        switch (tmp_pkt->admin.op_code) {
                          // If error type, resend the specified message
                          case messages::AdminPacket::ERROR: {

                            break;
                          }
                        }
                      }
                    }

                    // Reset state
                    current_state = States::READING_TRAILING;
                    reset_buffer();
                }
            }
            break;
        }
        /*
        Read and print debug message
        */
        case States::READING_DEBUG: {
            if (b == '\0') {
                current_state = READING_HEADER;
                // Copy stored string into temporal linear buffer
                char tmp[BUFFER_LENGTH];
                copy_from_buffer(tmp, total_read);
                // Send debug message to custom handler
                debug_log(tmp);

                reset_buffer();
            }
            break;
        }

    }
}
// ---------------
void Instance::reset_buffer() {
    base_ptr = current_position;
    total_read = 0;
}

void Instance::copy_from_buffer(void* dst, unsigned int len) {
    for (unsigned int i = 0; i < len; i++) {
        // Get the next value (mod BUFFLEN)
        char* src = (base_ptr + i - ring_buffer) % BUFFER_LENGTH + ring_buffer;
        ((char*)dst)[i] = *src;
        // A possible upgrade would be to copy with the size of the unsigned int
    }
}

void Instance::send_error_message() {
    // -- DEBUG --
    std::cout << "\033[31mEntering recovery mode\033[0m\n";

    // Create error message
    messages::AdminPacket error_packet;
    error_packet.sequence_num = _seq_number;
    error_packet.calculate_hash();

    // Send the same message without changing anything
    for (unsigned int i = 0; i < Instance::ERROR_MESSAGE_REPETITIONS; i++)
      send_packet(&error_packet, false);
}

// ---------------
// Send message implememtation

void Instance::send_packet(messages::Header* pkt, bool generate_automatic_data) {
    if (pkt->type >= (unsigned int)messages::PacketTypes::COUNT)
        return;

    // Prepare header
    if (generate_automatic_data) {
      pkt->calculate_hash();
      pkt->sequence_num = _seq_number++;
    }

    // Get the length of the message and send it
    unsigned int len = messages::size_by_pkt_type[pkt->type];
    send_bytes((char*)pkt, len);
}