import { describe, expect, it } from "vitest";
import {
  parseMerchantRegistration,
  RegistrationInputError,
} from "../src/lib/merchant-registration";

describe("merchant registration input", () => {
  it("normalizes email and trims text fields", () => {
    expect(
      parseMerchantRegistration({
        email: " Owner@Example.com ",
        password: "correct horse battery staple",
        business_name: " Kafilo Coffee ",
        slug: "kafilo-coffee",
      }),
    ).toEqual({
      email: "owner@example.com",
      password: "correct horse battery staple",
      business_name: "Kafilo Coffee",
      slug: "kafilo-coffee",
    });
  });

  it("rejects weak passwords and invalid slugs", () => {
    expect(() =>
      parseMerchantRegistration({
        email: "owner@example.com",
        password: "short",
        business_name: "Kafilo",
        slug: "admin",
      }),
    ).toThrowError(new RegistrationInputError("invalid_password"));
  });
});
