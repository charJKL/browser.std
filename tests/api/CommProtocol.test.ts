import { CommProtocol } from "$src/api/CommProtocol";

const data =
[
	{ 
		data: { name: new Map([[1, "one"], [2, "two"]]) } , 
		dataSerialized: "{\"name\":{\"__TYPE__\":\"MAP\",\"entries\":[[1,\"one\"],[2,\"two\"]]}}" 
	},
	{ 
		data: { name: new Map([["fruits", new Map([["id1", "orange"], ["id2", "apple"]])]]) } , 
		dataSerialized: "{\"name\":{\"__TYPE__\":\"MAP\",\"entries\":[[\"fruits\",{\"__TYPE__\":\"MAP\",\"entries\":[[\"id1\",\"orange\"],[\"id2\",\"apple\"]]}]]}}" // what a mess :)
	}
]
test.each(data)("`CommProtocol` properly handle `Map<,>` type.", function({data, dataSerialized})
{
	const packet = CommProtocol.Pack("variant", data);
	const result = CommProtocol.ValidatePacket(packet);
	
	expect(packet).toEqual({ variant: "variant", data: dataSerialized });
	expect(result).toEqual({ variant: "variant", data: data });
});

