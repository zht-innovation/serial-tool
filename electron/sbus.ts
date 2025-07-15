export class SBUSParser {
	private readonly START_BYTE = 0x0F;
	private readonly END_BYTE = 0x00;
	private readonly PACKET_LENGTH = 25;
	private readonly NUM_CHANNELS = 16;
	private readonly BIT_NUM_EVERY_CHANNEL = 11;
	private buffer: number[] = [];

	addData(data: Buffer): number[][] {
		for (const byte of data) {
			this.buffer.push(byte);
		}

		const packets: number[][] = [];

		while (this.buffer.length >= this.PACKET_LENGTH) {
			const startIndex = this.buffer.indexOf(this.START_BYTE);
			
			if (startIndex === -1) {
				this.buffer = [];
				break;
			}

			if (startIndex > 0) {
				this.buffer = this.buffer.slice(startIndex);
			}

			if (this.buffer.length < this.PACKET_LENGTH) {
				break;
			}

			if (this.buffer[this.PACKET_LENGTH - 1] === this.END_BYTE) {
				const packetData = this.buffer.slice(0, this.PACKET_LENGTH);
				const channels = this.parsePacket(packetData);
				
				if (channels) {
					packets.push(channels);
				}

				this.buffer = this.buffer.slice(this.PACKET_LENGTH);
			} else {
				this.buffer = this.buffer.slice(1); // remove the first byte and find next start byte
			}
		}

		return packets;
	}

	private parsePacket(packet: number[]): number[] | null {
		if (
			packet.length !== this.PACKET_LENGTH ||
			packet[0] !== this.START_BYTE ||
			packet[this.PACKET_LENGTH - 1] !== this.END_BYTE
		) {
			return null;
		}

		const channelData = packet.slice(1, 23); // 22 data bytes
		const channels: number[] = new Array(this.NUM_CHANNELS).fill(0);

		try {
			let bitOffset = 0;

			for (let ch = 0; ch < this.NUM_CHANNELS; ch++) {
				let value = 0;

				for (let bit = 0; bit < this.BIT_NUM_EVERY_CHANNEL; bit++) {
					const byteIndex = Math.floor((bitOffset + bit) / 8);
					const bitIndex = (bitOffset + bit) % 8;
					
					if (byteIndex < channelData.length) {
						if (channelData[byteIndex] & (1 << bitIndex)) {
							value |= (1 << bit);
						}
					}
				}

				channels[ch] = value;
				bitOffset += this.BIT_NUM_EVERY_CHANNEL;
			}

			return channels;
		} catch (error) {
			console.error('Error parsing SBUS packet:', error);
			return null;
		}
	} 

	channelsToMicroseconds(channels: number[]): number[] {
		if (channels.length !== this.NUM_CHANNELS) {
			throw new Error('Invalid channels length');
		}

		return channels.map(channel => {
			const usValue = Math.round(1000 + (channel - 172) * (2000 - 1000) / (1811 - 172));
			return Math.max(1000, Math.min(2000, usValue)); // Ensure within 1000-2000μs range
		});
	}
}