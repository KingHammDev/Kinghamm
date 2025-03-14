/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        JWT_SECRET: process.env.JWT_SECRET,
        DATABASE_URL: process.env.DATABASE_URL,
        MSSQL_SERVER: process.env.MSSQL_SERVER,
        MSSQL_DATABASE: process.env.MSSQL_DATABASE,
        MSSQL_USER: process.env.MSSQL_USER,
        MSSQL_PASSWORD: process.env.MSSQL_PASSWORD
    },
    devIndicators: {
        buildActivity: false,
        buildActivityPosition: 'bottom-right',
    },
};

export default nextConfig;
