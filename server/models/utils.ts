export const transform = (doc: any, ret: any) => {
  ret.id = ret._id ? ret._id.toString() : ret.id;
  delete ret._id;
  delete ret.__v;
};
