export default async function globalSetup() {
  console.log('Running global setup: Seeding test database...');
  try {
    const response = await fetch('http://localhost:8080/api/system/demo/seed', {
      method: 'POST',
    });
    if (!response.ok) {
      console.warn('Failed to seed database. It might not be enabled or the backend is unreachable.');
    } else {
      console.log('Database seeded successfully.');
    }
  } catch (error) {
    console.warn('Could not reach backend for seeding:', error.message);
  }
}
