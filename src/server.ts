import app from "./app";
import dotenv from 'dotenv';
import sql from "./config/database";

dotenv.config();

const PORT = process.env.PORT || 5000;

async function testConnectionDB() {
    try {
        await sql`SELECT 1`;
        console.log("Database connected!");
    } catch (error) {
        console.error("Database connection failed: ", error);
        process.exit();
    }
}

testConnectionDB();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})