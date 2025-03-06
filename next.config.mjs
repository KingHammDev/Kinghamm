/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        JWT_SECRET: process.env.JWT_SECRET,
    },
    // i18n: {
    //     locales: ['en', 'zh'],  // 支援的語言
    //     defaultLocale: 'zh',          // 預設語言
    //     localeDetection: true,        // 自動檢測瀏覽器語言
    // }
};

export default nextConfig;
