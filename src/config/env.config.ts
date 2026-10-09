import "dotenv/config";
const ENV_CONFIG = {
    port : process.env.PORT!!,
    node_env: process.env.NODE_ENV,

    //! database 
    db_uri: process.env.DB_URI!!,

    //! jwt 
    jwt_secret: process.env.JWT_SECRET!! ,
    jwt_expiry: process.env.JWT_EXPIRY!!,

    //! cloudinary
    cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME!!,
     cloudinary_api_key: process.env.CLOUDINARY_API_KEY!!,
     cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET!!,

    //! cookie
    cookie_express: process.env.COOKIE_EXPIRY!!, 

    //! email
    smtp_host: process.env.SMTP_HOST!!,
    smtp_service: process.env.SMTP_SERVICE!!,  
    smtp_port: process.env.SMTP_PORT!!,
    smtp_user: process.env.SMTP_USER!!,
    smtp_pass: process.env.SMTP_PASS!!,

    //! origins
    allow_origin: process.env.ALLOW_ORIGIN!!, 
};

const required = [
    "DB_URI",
    "JWT_SECRET",
    "JWT_EXPIRY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "ALLOW_ORIGIN"
] as const;
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

export default ENV_CONFIG;