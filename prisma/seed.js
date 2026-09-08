const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Smart Procurement Database...');

  // 1. Centres
  const lakshmipur = await prisma.centre.upsert({
    where: { code: 'LAKSH' },
    update: {},
    create: {
      code: 'LAKSH',
      name: 'Lakshmipur Procurement Centre',
      district: 'Nagpur',
      distance: '4.7 km',
      dailyCapacityBays: 6,
      avgProcessingMinPerQtl: 1.2,
      recommended: true,
    },
  });

  const rampur = await prisma.centre.upsert({
    where: { code: 'RAMP' },
    update: {},
    create: {
      code: 'RAMP',
      name: 'Rampur Procurement Centre',
      district: 'Nagpur',
      distance: '2.0 km',
      dailyCapacityBays: 4,
      avgProcessingMinPerQtl: 1.8,
      recommended: false,
    },
  });

  const shivpur = await prisma.centre.upsert({
    where: { code: 'SHIV' },
    update: {},
    create: {
      code: 'SHIV',
      name: 'Shivpur Procurement Centre',
      district: 'Nagpur',
      distance: '6.2 km',
      dailyCapacityBays: 5,
      avgProcessingMinPerQtl: 1.5,
      recommended: false,
    },
  });

  console.log('Centres seeded: Lakshmipur, Rampur, Shivpur');

  // 2. Time Slots for each centre
  const slots = [
    { timeWindow: '10:00 AM – 10:30 AM', shortTime: '10:00 AM', maxCapacity: 15 },
    { timeWindow: '10:30 AM – 11:00 AM', shortTime: '10:30 AM', maxCapacity: 15 },
    { timeWindow: '11:00 AM – 11:30 AM', shortTime: '11:00 AM', maxCapacity: 15 },
    { timeWindow: '11:30 AM – 12:00 PM', shortTime: '11:30 AM', maxCapacity: 15 },
    { timeWindow: '12:00 PM – 12:30 PM', shortTime: '12:00 PM', maxCapacity: 15 },
  ];

  for (const centre of [lakshmipur, rampur, shivpur]) {
    for (const slot of slots) {
      const existing = await prisma.timeSlot.findFirst({
        where: { centreId: centre.id, shortTime: slot.shortTime },
      });
      if (!existing) {
        await prisma.timeSlot.create({
          data: {
            centreId: centre.id,
            timeWindow: slot.timeWindow,
            shortTime: slot.shortTime,
            maxCapacity: slot.maxCapacity,
          },
        });
      }
    }
  }
  console.log('Time slots seeded for all centres');

  // 3. Crop MSP Rates
  const crops = [
    { cropName: 'Cotton', mspPerQtl: 7121 },
    { cropName: 'Wheat', mspPerQtl: 2275 },
    { cropName: 'Soybean', mspPerQtl: 4892 },
    { cropName: 'Mustard', mspPerQtl: 5650 },
    { cropName: 'Paddy', mspPerQtl: 2300 },
    { cropName: 'Gram', mspPerQtl: 5440 },
  ];

  for (const c of crops) {
    await prisma.cropMsp.upsert({
      where: { cropName: c.cropName },
      update: { mspPerQtl: c.mspPerQtl },
      create: {
        cropName: c.cropName,
        mspPerQtl: c.mspPerQtl,
        standardMoisture: 8.0,
        maxAllowedMoisture: 12.0,
      },
    });
  }
  console.log('Crop MSP rates seeded');

  // 4. Official User
  await prisma.official.upsert({
    where: { officialId: 'OFF001' },
    update: {},
    create: {
      officialId: 'OFF001',
      name: 'Ramesh Verma',
      centreId: lakshmipur.id,
      role: 'Centre Incharge',
      passwordHash: 'password123',
    },
  });
  console.log('Official user OFF001 seeded');

  // 5. Farmer Demo Account
  await prisma.farmer.upsert({
    where: { mobile: '9876543210' },
    update: {},
    create: {
      mobile: '9876543210',
      farmerCode: 'FARM001',
      name: 'Rajesh Kumar',
      district: 'Nagpur',
      village: 'Umred',
      landAcres: 5.5,
      primaryCrop: 'Cotton',
    },
  });
  console.log('Farmer demo user 9876543210 seeded');

  console.log('Database seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
