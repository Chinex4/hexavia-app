// Allow importing images as modules so bundler asset references type-check.
declare module "*.png" {
  const value: number;
  export default value;
}
