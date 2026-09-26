import pg from 'pg';

const passwords = ['postgres', 'admin', 'root', 'password', '1234', '123456', ''];

async function tryPasswords() {
  for (const pwd of passwords) {
    const pool = new pg.Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'postgres', // connect to default db first
      password: pwd,
      port: 5432,
    });
    
    try {
      const client = await pool.connect();
      console.log(`Success! Password is: "${pwd}"`);
      
      // Now try to create raahat db
      try {
        await client.query('CREATE DATABASE raahat');
        console.log('Created database raahat');
      } catch (e) {
        if (e.code === '42P04') {
          console.log('Database raahat already exists');
        } else {
          console.error('Error creating db:', e.message);
        }
      }
      
      client.release();
      await pool.end();
      return pwd;
    } catch (e) {
      // console.log(`Failed for "${pwd}": ${e.message}`);
    }
    await pool.end();
  }
  console.log('None of the common passwords worked.');
}

tryPasswords();
