class DroneData:
    def __init__(
        self,
        battery,
        altitude,
        heading,
        airspeed,
        groundspeed,
        attitude,
        gps,
        fire_detected,
        temperature,
        wind_direction,
        timestamp
    ):
        self.battery = battery
        self.altitude = altitude
        self.heading = heading
        self.airspeed = airspeed
        self.groundspeed = groundspeed
        self.attitude = attitude      
        self.gps = gps               
        self.fire_detected = fire_detected
        self.temperature = temperature
        self.wind_direction = wind_direction
        self.timestamp = timestamp

    def to_dict(self):
        return {
            "battery": self.battery,
            "altitude": self.altitude,
            "heading": self.heading,
            "airspeed": self.airspeed,
            "groundspeed": self.groundspeed,
            "attitude": self.attitude,
            "gps": self.gps,
            "fire_detected": self.fire_detected,
            "temperature": self.temperature,
            "wind_direction": self.wind_direction,
            "timestamp": self.timestamp
        }
