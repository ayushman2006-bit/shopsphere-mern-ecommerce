// ShopSphere - simple MERN online shopping system
// Locally this file starts the Express server.
// On Vercel the exported app is used as a serverless function instead.

require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');

// Vercel detects this export and runs the app as a single function.
module.exports = app;

// When running on a normal computer, connect to MongoDB and listen on a port.
// Vercel sets the VERCEL environment variable automatically.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  const startServer = async () => {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing. Copy backend/.env.example to backend/.env.');
      process.exit(1);
    }

    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  };

  startServer();
}
