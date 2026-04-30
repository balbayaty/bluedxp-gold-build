/**
 * Teltonika Direct Device Adapter
 * 
 * Direct integration with Teltonika GPS devices (FMC800, FMC150, etc.)
 * CST certified for Saudi Arabia.
 * 
 * Note: For most use cases, use a universal platform adapter (Navixy, Wialon, Flespi)
 * which already supports Teltonika devices. This adapter is for direct device
 * communication scenarios (custom server, local deployment).
 * 
 * @module adapters/iot/devices/teltonika
 */

export { createNavixyAdapter as createTeltonikaAdapter } from '../platforms/navixyAdapter';
export { NavixyAdapter as TeltonikaAdapter } from '../platforms/navixyAdapter';

// For direct Teltonika server integration, implement a custom adapter
// that listens to Teltonika Codec protocols (Codec 8, Codec 8 Extended)
