export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    if (source === "body") {
      req.body = result.data;
    }

    if (source === "params") {
      Object.assign(req.params, result.data);
    }

    if (source === "query") {
      req.validatedQuery = result.data;
    }

    next();
  };
};
