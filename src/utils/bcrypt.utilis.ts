import bcrypt from "bcryptjs";

//! hash password

export const hashPassword = async (password: string) => {
    try {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
        // const hash  = await bcrypt.hash(password, salt);
        // return hash; i = o
    } catch (error) {
        console.log(error);
        throw error;
    }
}

//! compare password
export const comparePassword = async (password: string, hash : string) => {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        console.log(error);
        throw error;
    }
} 