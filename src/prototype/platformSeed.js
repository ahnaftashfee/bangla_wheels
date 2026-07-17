export const cities = ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur", "Mymensingh"];
export const makes = ["Toyota", "Honda", "Nissan", "Mitsubishi", "Suzuki", "BMW", "Mercedes-Benz", "Audi", "Hyundai", "Kia", "Mazda", "Lexus"];
export const bodies = ["Sedan", "Hatchback", "SUV", "MPV", "Pickup", "Wagon", "Coupe"];
export const fuels = ["Petrol", "Diesel", "Hybrid", "CNG", "Electric", "Petrol+CNG"];
export const transmissions = ["Automatic", "Manual", "CVT", "DCT"];
export const featureGroups = {
  Safety: ["ABS", "Airbags", "ESC", "Reverse Camera", "Parking Sensors", "Lane Departure", "Blind Spot", "Collision Warning", "Hill Start"],
  Comfort: ["Auto AC", "Heated Seats", "Power Seats", "Sunroof", "Push-Button Start", "Keyless Entry"],
  Technology: ["Navigation", "Touchscreen", "CarPlay", "Android Auto", "Bluetooth", "USB", "Digital Dashboard"],
  Exterior: ["Alloy Wheels", "LED Headlights", "Fog Lights", "Roof Rails", "Tinted Windows"],
  Other: ["CNG Kit", "Spare Tyre", "Owner's Manual"],
};

export const inspectionSections = [
  { name: "Underhood", points: 20, items: ["Battery", "Alternator", "Engine oil", "Oil cap", "Coolant", "Hoses", "Radiator", "Power steering", "Brake fluid", "Air filter", "Timing chain", "Engine mount", "Transmission mount", "Fuel system", "AC compressor", "AC condenser", "Cold start noise", "Warm start noise", "Idle stability", "Exhaust smoke"] },
  { name: "Under Vehicle", points: 15, items: ["Oil leaks", "Transmission leaks", "Coolant leaks", "Differential leaks", "Exhaust", "Frame/unibody", "Front struts", "Ball joints", "Suspension bushings", "Rear suspension", "CV boots", "Front calipers", "Rear calipers", "Front rotors", "Rear rotors"] },
  { name: "Tyres & Wheels", points: 10, items: ["Front left tread", "Front right tread", "Rear left tread", "Rear right tread", "Matching tyres", "Sidewalls", "Rims", "Lug nuts", "Spare tyre", "Valve stems"] },
  { name: "Body & Paint", points: 15, items: ["Front panel gaps", "Door gaps", "Rear gaps", "Paint shade", "Filler test", "Windshield", "Front bumper", "Rear bumper", "Bonnet alignment", "Driver door", "Passenger door", "Rear doors", "Boot seal", "Roof", "Headlights"] },
  { name: "Lights & Electricals", points: 10, items: ["Headlights", "Front signals", "Fog lights", "Brake lights", "Reverse lights", "Rear signals", "Parking lights", "Warning lights", "Interior lights", "Hazards"] },
  { name: "Interior", points: 15, items: ["Water ingress", "Front upholstery", "Rear seat", "Carpets", "Headliner", "Dashboard", "Steering wear", "Power windows", "Central locking", "AC cooling", "Heater", "Audio", "Sunroof", "Rear defrost", "Gauges"] },
  { name: "Road Test", points: 15, items: ["Cold start", "Shift quality", "Clutch", "Acceleration", "Steering effort", "Return-to-centre", "Regular braking", "Hard braking", "Suspension noise", "Highway noise", "Full-lock turns", "Parking brake", "OBD-II scan", "Post-drive leaks", "Cruise control"] },
];

export const legalCopy = {
  "privacy-policy": "BanglaWheel collects account, listing, KYC, enquiry, and transaction information only to operate the marketplace, verify trust signals, prevent fraud, and support buyers and sellers.",
  "terms-of-service": "Users must provide accurate vehicle information, own or be authorised to sell listed vehicles, and agree that inspection, warranty, financing, and KYC integrations are prototype workflows until production launch.",
  "data-deletion": "Submit your phone number and account email to request deletion of saved cars, enquiries, KYC drafts, and notification preferences from BanglaWheel systems.",
  about: "BanglaWheel is a Bangladesh-first automotive trust marketplace focused on verified sellers, inspection-backed listings, warranty protection, financing, and buyer education.",
};
