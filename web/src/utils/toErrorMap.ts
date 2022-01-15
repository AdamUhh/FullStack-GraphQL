import { FieldError } from "../generated/graphql";

// toErrorMap essentially gets the errors:[{field, message}]
// inside server/src/resolvers/user.ts, etc
export const toErrorMap = (errors: FieldError[]) => {
  // A Record<K, T> is an object type whose property keys are K and whose property values are T
  const errorMap: Record<string, string> = {};
  errors.forEach(({ field, message }) => {
    errorMap[field] = message; //setting the errorMap with key: field and value: message
  });
  return errorMap;
};
