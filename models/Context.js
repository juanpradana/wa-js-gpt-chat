import mongoose from "mongoose";

const contextSchema = new mongoose.Schema({
    contactId: {
        type: String,
        required: true
    },
    contextId: {
        type: String,
        required: true
    }
});

export default mongoose.model("Context", contextSchema);