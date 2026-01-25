import mongoose , {Schema , Document} from "mongoose";

interface LagChapters extends Document {
    subjectId: mongoose.Types.ObjectId,
    
}