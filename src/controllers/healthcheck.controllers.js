import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

const healthCheck = asyncHandler((req, res) => {
  console.log("logic to connect with db");
  
  res.status(200).json(new ApiResponse(200, { message: "Server is running" }));
});

export { healthCheck };
