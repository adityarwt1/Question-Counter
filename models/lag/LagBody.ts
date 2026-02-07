import { LagType } from "@/types/lagType";
import mongoose, { Schema, Document } from "mongoose";

interface LagBodyDocument extends Document {
  lagChapterId: mongoose.Types.ObjectId;
  body: string;
  type: LagType;
}

const LagBodySchema: Schema<LagBodyDocument> = new Schema(
  {
    lagChapterId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "LagChapter",
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["question", "formula", "theory", "approach", "mistake", "learning", "trick", "revisit"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const LagBody =
  mongoose.models.LagBody || mongoose.model("LagBody", LagBodySchema);

export default LagBody;