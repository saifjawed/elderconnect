import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import User from './models/User.js';
import Elder from './models/Elder.js';
import CaretakerProfile from './models/CaretakerProfile.js';
import Booking from './models/Booking.js';
import Review from './models/Review.js';
import Message from './models/Message.js';

dotenv.config();

async function seed() {
  let mongod = null;

  try {
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      console.log('Using in-memory MongoDB:', mongoUri);
    } else {
      console.log('Using MongoDB URI from env');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Elder.deleteMany({});
    await CaretakerProfile.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    await Message.deleteMany({});
    console.log('Cleared existing data');

    // Create admin
    const admin = await User.create({
      firstName: 'Vikram',
      lastName: 'Singh',
      email: 'admin@nestlife.in',
      password: 'admin123',
      role: 'Admin',
      phone: '+91-9876543210',
      isActive: true
    });

    // Create customers
    const customers = await User.create([
      {
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'rahul@example.in',
        password: 'password123',
        role: 'Customer',
        phone: '+91-9876500001',
        address: { street: 'Nucleus Mall, Circular Road', city: 'Ranchi', state: 'JH', zipCode: '834001', coordinates: { lat: 23.3732, lng: 85.3283 } },
        isActive: true
      },
      {
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'priya@example.in',
        password: 'password123',
        role: 'Customer',
        phone: '+91-9876500002',
        address: { street: 'Gateway of India, Apollo Bandar', city: 'Mumbai', state: 'MH', zipCode: '400001', coordinates: { lat: 18.9220, lng: 72.8347 } },
        isActive: true
      },
      {
        firstName: 'Amit',
        lastName: 'Kumar',
        email: 'amit@example.in',
        password: 'password123',
        role: 'Customer',
        phone: '+91-9876500003',
        address: { street: 'IIT ISM, Sardar Patel Nagar', city: 'Dhanbad', state: 'JH', zipCode: '826004', coordinates: { lat: 23.8143, lng: 86.4412 } },
        isActive: true
      }
    ]);

    // Create elders (linked to customers)
    const elders = await Elder.create([
      {
        parentCustomer: customers[0]._id, // Rahul's father
        firstName: 'Ram Narayan',
        lastName: 'Sharma',
        relation: 'Father',
        phone: '+91-9876500101',
        address: { street: 'Nucleus Mall, Circular Road', city: 'Ranchi', state: 'JH', zipCode: '834001', coordinates: { lat: 23.3732, lng: 85.3283 } },
        isActive: true
      },
      {
        parentCustomer: customers[1]._id, // Priya's mother
        firstName: 'Shanti',
        lastName: 'Patel',
        relation: 'Mother',
        phone: '+91-9876500102',
        address: { street: 'Gateway of India, Apollo Bandar', city: 'Mumbai', state: 'MH', zipCode: '400001', coordinates: { lat: 18.9220, lng: 72.8347 } },
        isActive: true
      },
      {
        parentCustomer: customers[2]._id, // Amit's father
        firstName: 'Suresh',
        lastName: 'Kumar',
        relation: 'Father',
        phone: '+91-9876500103',
        address: { street: 'IIT ISM, Sardar Patel Nagar', city: 'Dhanbad', state: 'JH', zipCode: '826004', coordinates: { lat: 23.8143, lng: 86.4412 } },
        isActive: true
      }
    ]);

    // Create caretakers
    const caretakersData = [
      {
        firstName: 'Sunita',
        lastName: 'Devi',
        email: 'sunita@eldercare.in',
        password: 'password123',
        role: 'Caretaker',
        phone: '+91-9876500201',
        address: { street: 'Jubilee Park Road', city: 'Jamshedpur', state: 'JH', zipCode: '831001', coordinates: { lat: 22.8046, lng: 86.1925 } },
        isActive: true
      },
      {
        firstName: 'Rajesh',
        lastName: 'Gupta',
        email: 'rajesh@eldercare.in',
        password: 'password123',
        role: 'Caretaker',
        phone: '+91-9876500202',
        address: { street: 'Shaniwar Wada, Shaniwar Peth', city: 'Pune', state: 'MH', zipCode: '411030', coordinates: { lat: 18.5195, lng: 73.8553 } },
        isActive: true
      },
      {
        firstName: 'Meena',
        lastName: 'Iyer',
        email: 'meena@eldercare.in',
        password: 'password123',
        role: 'Caretaker',
        phone: '+91-9876500203',
        address: { street: 'UB City, Vittal Mallya Road', city: 'Bengaluru', state: 'KA', zipCode: '560001', coordinates: { lat: 12.9716, lng: 77.5946 } },
        isActive: true
      },
      {
        firstName: 'Anil',
        lastName: 'Verma',
        email: 'anil@eldercare.in',
        password: 'password123',
        role: 'Caretaker',
        phone: '+91-9876500204',
        address: { street: 'City Centre, Sector 4', city: 'Bokaro Steel City', state: 'JH', zipCode: '827004', coordinates: { lat: 23.6693, lng: 86.1511 } },
        isActive: true
      },
      {
        firstName: 'Kavita',
        lastName: 'Reddy',
        email: 'kavita@eldercare.in',
        password: 'password123',
        role: 'Caretaker',
        phone: '+91-9876500205',
        address: { street: 'Charminar, Charminar Rd', city: 'Hyderabad', state: 'TS', zipCode: '500002', coordinates: { lat: 17.3616, lng: 78.4747 } },
        isActive: true
      },
      {
        firstName: 'Vikash',
        lastName: 'Singh',
        email: 'vikash@eldercare.in',
        password: 'password123',
        role: 'Caretaker',
        phone: '+91-9876500206',
        address: { street: 'Baidyanath Dham', city: 'Deoghar', state: 'JH', zipCode: '814112', coordinates: { lat: 24.4815, lng: 86.6993 } },
        isActive: true
      },
      {
        firstName: 'Manoj',
        lastName: 'Tiwari',
        email: 'manoj@eldercare.in',
        password: 'password123',
        role: 'Caretaker',
        phone: '+91-9876500207',
        address: { street: 'India Gate, Rajpath', city: 'New Delhi', state: 'DL', zipCode: '110001', coordinates: { lat: 28.6129, lng: 77.2295 } },
        isActive: true
      }
    ];

    const caretakers = await User.create(caretakersData);

    // Create caretaker profiles
    const profiles = await CaretakerProfile.create([
      {
        user: caretakers[0]._id,
        bio: 'Experienced registered nurse with 10+ years in elder care.',
        services: ['Health Check-up', 'Medication Management', 'Mobility Assistance'],
        hourlyRate: 500, // INR
        certifications: ['Registered Nurse (RN)', 'CPR Certified', 'Dementia Care Specialist'],
        experience: 10,
        availability: {
          monday: { available: true, start: '08:00', end: '18:00' },
          tuesday: { available: true, start: '08:00', end: '18:00' },
          wednesday: { available: true, start: '08:00', end: '18:00' },
          thursday: { available: true, start: '08:00', end: '18:00' },
          friday: { available: true, start: '08:00', end: '18:00' },
          saturday: { available: false },
          sunday: { available: false }
        },
        cities: ['Ranchi', 'Jamshedpur'],
        languages: ['Hindi', 'English'],
        isVerified: true
      },
      {
        user: caretakers[1]._id,
        bio: 'Compassionate caregiver specializing in companionship and meal preparation.',
        services: ['Companionship', 'Meal Preparation', 'Errands'],
        hourlyRate: 350, // INR
        certifications: ['Certified Nursing Assistant', 'First Aid Certified'],
        experience: 5,
        availability: {
          monday: { available: true, start: '09:00', end: '17:00' },
          tuesday: { available: true, start: '09:00', end: '17:00' },
          wednesday: { available: true, start: '09:00', end: '17:00' },
          thursday: { available: true, start: '09:00', end: '17:00' },
          friday: { available: true, start: '09:00', end: '17:00' },
          saturday: { available: true, start: '10:00', end: '16:00' },
          sunday: { available: true, start: '10:00', end: '16:00' }
        },
        cities: ['Pune', 'Mumbai'],
        languages: ['Hindi', 'Marathi', 'English'],
        isVerified: true
      },
      {
        user: caretakers[2]._id,
        bio: 'Physical therapist turned elder care specialist.',
        services: ['Mobility Assistance', 'Health Check-up', 'Companionship'],
        hourlyRate: 600, // INR
        certifications: ['Physical Therapist', 'Geriatric Care Specialist'],
        experience: 8,
        availability: {
          monday: { available: true, start: '07:00', end: '15:00' },
          tuesday: { available: true, start: '07:00', end: '15:00' },
          wednesday: { available: true, start: '07:00', end: '15:00' },
          thursday: { available: true, start: '07:00', end: '15:00' },
          friday: { available: true, start: '07:00', end: '15:00' },
          saturday: { available: false },
          sunday: { available: false }
        },
        cities: ['Bengaluru'],
        languages: ['Kannada', 'English', 'Hindi'],
        isVerified: true
      },
      {
        user: caretakers[3]._id,
        bio: 'Retired teacher with a passion for senior care and companionship.',
        services: ['Companionship', 'Errands', 'Meal Preparation'],
        hourlyRate: 300, // INR
        certifications: ['Companion Care Certificate'],
        experience: 3,
        availability: {
          monday: { available: true, start: '10:00', end: '20:00' },
          tuesday: { available: true, start: '10:00', end: '20:00' },
          wednesday: { available: true, start: '10:00', end: '20:00' },
          thursday: { available: true, start: '10:00', end: '20:00' },
          friday: { available: true, start: '10:00', end: '20:00' },
          saturday: { available: true, start: '10:00', end: '20:00' },
          sunday: { available: true, start: '10:00', end: '20:00' }
        },
        cities: ['Bokaro Steel City', 'Dhanbad'],
        languages: ['Hindi', 'English'],
        isVerified: true
      }
    ]);

    // Create a sample completed booking with review
    const booking1 = await Booking.create({
      customer: customers[0]._id,
      elder: elders[0]._id,
      caretaker: caretakers[0]._id, // Sunita (Ranchi/Jamshedpur area)
      serviceType: 'Health Check-up',
      status: 'Completed',
      scheduledDate: new Date('2024-11-15'),
      startTime: '09:00',
      endTime: '11:00',
      address: { street: 'Nucleus Mall, Circular Road', city: 'Ranchi', state: 'JH', zipCode: '834001', coordinates: { lat: 23.3732, lng: 85.3283 } },
      notes: 'Check blood pressure and medication.',
      totalAmount: 1000,
      paymentStatus: 'Paid',
      completedAt: new Date('2024-11-15T11:00:00Z')
    });

    // Create sample pending booking
    const booking2 = await Booking.create({
      customer: customers[1]._id,
      elder: elders[1]._id,
      caretaker: caretakers[1]._id, // Rajesh (Pune/Mumbai area)
      serviceType: 'Companionship',
      status: 'Pending',
      scheduledDate: new Date(Date.now() + 86400000),
      startTime: '14:00',
      endTime: '16:00',
      address: { street: 'Gateway of India, Apollo Bandar', city: 'Mumbai', state: 'MH', zipCode: '400001', coordinates: { lat: 18.9220, lng: 72.8347 } },
      notes: 'Weekly companionship visit.',
      totalAmount: 700,
      paymentStatus: 'Pending'
    });

    // Create sample accepted booking
    const booking3 = await Booking.create({
      customer: customers[2]._id,
      elder: elders[2]._id,
      caretaker: caretakers[3]._id, // Anil (Bokaro/Dhanbad area)
      serviceType: 'Mobility Assistance',
      status: 'Accepted',
      scheduledDate: new Date(Date.now() + 172800000),
      startTime: '10:00',
      endTime: '12:00',
      address: { street: 'IIT ISM, Sardar Patel Nagar', city: 'Dhanbad', state: 'JH', zipCode: '826004', coordinates: { lat: 23.8143, lng: 86.4412 } },
      notes: 'Help with morning exercises.',
      totalAmount: 600,
      paymentStatus: 'Pending'
    });

    // Create a review for the completed booking
    await Review.create({
      booking: booking1._id,
      customer: customers[0]._id,
      caretaker: caretakers[0]._id,
      rating: 5,
      comment: 'Sunita was wonderful with my father. Very professional and caring.',
      isVisible: true
    });

    // Create sample messages
    await Message.create([
      {
        sender: customers[0]._id,
        receiver: caretakers[0]._id,
        booking: booking1._id,
        content: 'Hi Sunita, thank you for taking care of my father yesterday!',
        isRead: true
      },
      {
        sender: caretakers[0]._id,
        receiver: customers[0]._id,
        booking: booking1._id,
        content: "You're very welcome! Ram Narayan Ji is such a lovely person.",
        isRead: false
      }
    ]);

    // Update caretaker rating
    await CaretakerProfile.updateOne(
      { user: caretakers[0]._id },
      { rating: 5, totalReviews: 1 }
    );

    console.log('\nSeed data created successfully!');
    console.log(`Admin: ${admin.email}`);
    console.log(`Customers: ${customers.length}`);
    console.log(`Elders: ${elders.length}`);
    console.log(`Caretakers: ${caretakers.length}`);
    console.log(`Bookings: 3`);
    console.log(`Reviews: 1`);
    console.log(`Messages: 2`);

    await mongoose.disconnect();
    if (mongod) await mongod.stop();

  } catch (error) {
    console.error('Seed error:', error);
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    process.exit(1);
  }
}

seed();
