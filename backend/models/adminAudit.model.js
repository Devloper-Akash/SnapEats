import mongoose from "mongoose";

const adminAuditSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  action: { type: String, required: true, index: true },
  targetType: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

adminAuditSchema.index({ createdAt: -1 });

const AdminAudit = mongoose.model("AdminAudit", adminAuditSchema);
export default AdminAudit;
