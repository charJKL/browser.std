import { hasProp } from "$src/util/func/hasProp";

const data =
[
	{ object: {}, prop: "fruits", blueprint: undefined, expectedToBe: false },
	{ object: { fruit: "", healthy: true}, prop: "healthy", blueprint: undefined, expectedToBe: true },
	{ object: { fruit: "", healthy: true}, prop: "healthy", blueprint: Boolean, expectedToBe: true },
	{ object: { fruit: "", healthy: true}, prop: "healthy", blueprint: true, expectedToBe: true },
	{ object: { fruit: "", healthy: true}, prop: "healthy", blueprint: false, expectedToBe: false },
	{ object: { fruits: "", count: 7}, prop: "count", blueprint: undefined, expectedToBe: true },
	{ object: { fruits: "", count: 7}, prop: "count", blueprint: Number, expectedToBe: true },
	{ object: { fruits: "", count: 7}, prop: "count", blueprint: 7, expectedToBe: true },
	{ object: { fruits: "", count: "7"}, prop: "count", blueprint: 1, expectedToBe: false },
	{ object: { fruit: "apple" }, prop: "fruit", blueprint: undefined, expectedToBe: true },
	{ object: { fruit: "apple" }, prop: "fruit", blueprint: String, expectedToBe: true },
	{ object: { fruit: "apple" }, prop: "fruit", blueprint: "apple", expectedToBe: true },
	{ object: { fruit: "apple" }, prop: "fruit", blueprint: "orange", expectedToBe: false }
]
test.each(data)("Does $object has \"$prop\" property, and it's type is $blueprint? ", function({object, prop, blueprint, expectedToBe})
{
	const doesHave = hasProp(object, prop, blueprint);
	
	expect(doesHave).toBe(expectedToBe);
});
