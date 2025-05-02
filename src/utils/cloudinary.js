import { v2 as cloudinary } from 'cloudinary';

async function cloudinaryfn(fileName) {

    if(!fileName){
        return null;
    }

    fileName = `./public/images/${fileName}`
    // console.log(typeof fileName);

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });
    
    // Upload an image
     const uploadResult = await cloudinary.uploader
       .upload(
           fileName
       )
       .catch((error) => {
           console.log(error);
       });
    
    console.log(uploadResult);
    return uploadResult.secure_url;
        
};

export default cloudinaryfn;