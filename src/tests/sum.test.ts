import { describe, it, expect } from "vitest";
import { sum } from "../utils/sum";

describe("sum", () => {
    it("adds two numbers", () => {
        expect(sum(1, 2)).toEqual(3);
    });

    it("handles negative", ()=> {
        expect(sum(-1, -1)).toBe(-2);
    })
})