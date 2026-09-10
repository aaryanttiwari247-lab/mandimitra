import { Booking, BookingStatus } from "./types";
import { LOCATIONS_DATA, PROCUREMENT_CENTRES, getCentresByLocation } from "./locations-centres";
import { CROP_MSP_RATES } from "./msp-rates";

const FIRST_NAMES = [
  "Rameshwar", "Harish", "Suresh", "Baldev", "Gurpreet", "Kuldeep", "Mahendra",
  "Jagdish", "Om Prakash", "Rajesh", "Devendra", "Ramkaran", "Shivraj", "Dharmendra",
  "Mukesh", "Gopal", "Kailash", "Bhanwar", "Bhagwan", "Santosh", "Manohar",
  "Hakam", "Jaswant", "Arjun", "Pappu", "Radheshyam", "Madan", "Nandkishore",
  "Govind", "Vikram", "Chhaganlal", "Hiralal", "Khemchand", "Laxminarayan",
];

const LAST_NAMES = [
  "Singh", "Patel", "Yadav", "Sharma", "Chaudhary", "Verma", "Meena",
  "Gurjar", "Tiwari", "Solanki", "Dangi", "Mewada", "Dhakar", "Pawar",
  "Malviya", "Rathore", "Bishnoi", "Jat", "Rajput", "Khatri",
];

const TIME_SLOTS = [
  { time: "09:30 AM", fullTime: "09:30 AM – 10:00 AM" },
  { time: "10:00 AM", fullTime: "10:00 AM – 10:30 AM" },
  { time: "10:30 AM", fullTime: "10:30 AM – 11:00 AM" },
  { time: "11:00 AM", fullTime: "11:00 AM – 11:30 AM" },
  { time: "11:30 AM", fullTime: "11:30 AM – 12:00 PM" },
  { time: "12:00 PM", fullTime: "12:00 PM – 12:30 PM" },
  { time: "01:30 PM", fullTime: "01:30 PM – 02:00 PM" },
  { time: "02:00 PM", fullTime: "02:00 PM – 02:30 PM" },
  { time: "02:30 PM", fullTime: "02:30 PM – 03:00 PM" },
  { time: "03:00 PM", fullTime: "03:00 PM – 03:30 PM" },
  { time: "03:30 PM", fullTime: "03:30 PM – 04:00 PM" },
  { time: "04:00 PM", fullTime: "04:00 PM – 04:30 PM" },
];

const GRADES: ("Grade A" | "Grade B" | "Grade C" | "Grade D")[] = [
  "Grade A",
  "Grade A",
  "Grade B",
  "Grade B",
  "Grade C",
  "Grade D",
];

const STATUS_DISTRIBUTION: BookingStatus[] = [
  "WAITING",
  "WAITING",
  "WAITING",
  "WAITING",
  "WAITING",
  "CALLED",
  "VERIFIED",
  "VERIFIED",
  "PROCESSING",
  "COMPLETED",
  "COMPLETED",
];

export function generateSeedBookings(): Booking[] {
  const today = new Date().toISOString().split("T")[0];
  const bookings: Booking[] = [];

  // 1. Initial primary token A101 (Preserved for backward compatibility & direct testing)
  bookings.push({
    bookingId: "BOOK-INIT-001",
    tokenNumber: 101,
    token: "A101",
    farmerId: "FMR9801",
    farmerName: "Rameshwar Singh",
    farmerMobile: "9876543210",
    crop: "Wheat",
    cropGrade: "Grade A",
    quantity: 45,
    location: "Bhopal",
    centre: "Lakshmipur Procurement Centre",
    centreId: "centre-bhopal-lakshmipur",
    distance: "4.7 km",
    date: today,
    time: "10:00 AM",
    fullTime: "10:00 AM – 10:30 AM",
    availableSlots: 10,
    queuePosition: 1,
    waitTime: 15,
    status: "WAITING",
    queueStatus: "WAITING",
    procurementStatus: "WAITING",
    arrivalTime: "09:50 AM",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  });

  let tokenCounter = 102;
  const tokenPrefixes = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "R", "S", "T"];

  // Generate 11-13 farmers for EVERY location across all allotted centres
  LOCATIONS_DATA.forEach((loc, locIndex) => {
    const allottedCentres = getCentresByLocation(loc.name);
    const farmerCountForLocation = 11 + (locIndex % 3); // 11 to 13 farmers per location

    for (let i = 0; i < farmerCountForLocation; i++) {
      if (loc.name === "Bhopal" && i === 0) continue;

      const centre = allottedCentres[i % allottedCentres.length];
      const firstName = FIRST_NAMES[(locIndex * 7 + i * 3) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(locIndex * 5 + i * 2) % LAST_NAMES.length];
      const farmerName = `${firstName} ${lastName}`;

      const mobileDigits = (9820000000 + locIndex * 100000 + i * 789).toString().padEnd(10, "5");
      const farmerMobile = mobileDigits.slice(0, 10);

      const cropItem = CROP_MSP_RATES[(locIndex * 2 + i) % CROP_MSP_RATES.length];
      const cropGrade = GRADES[(i + locIndex) % GRADES.length];
      const quantity = 15 + ((locIndex * 13 + i * 7) % 85);

      const status = STATUS_DISTRIBUTION[(i + locIndex) % STATUS_DISTRIBUTION.length];
      const slot = TIME_SLOTS[i % TIME_SLOTS.length];

      const prefix = tokenPrefixes[(locIndex + Math.floor(tokenCounter / 100)) % tokenPrefixes.length];
      const token = `${prefix}${tokenCounter}`;

      const booking: Booking = {
        bookingId: `BOOK-SEED-${loc.id.toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
        tokenNumber: tokenCounter,
        token,
        farmerId: `FMR${loc.id.slice(0, 3).toUpperCase()}${100 + i}`,
        farmerName,
        farmerMobile,
        crop: cropItem.name,
        cropGrade,
        quantity,
        location: loc.name,
        centre: centre.name,
        centreId: centre.id,
        distance: centre.distance,
        date: today,
        time: slot.time,
        fullTime: slot.fullTime,
        availableSlots: Math.max(1, 15 - (i % 12)),
        queuePosition: i + 1,
        waitTime: Math.max(10, centre.baseWaitMinutes + (i % 4) * 8),
        status,
        queueStatus: status,
        procurementStatus: status,
        arrivalTime: `${slot.time.split(":")[0]}:15 ${slot.time.slice(-2)}`,
        createdAt: new Date(Date.now() - (i + 1) * 600000).toISOString(),
        updatedAt: new Date(Date.now() - (i + 1) * 300000).toISOString(),
      };

      bookings.push(booking);
      tokenCounter++;
    }
  });

  return bookings;
}
