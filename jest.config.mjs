import { createDefaultPreset, pathsToModuleNameMapper } from "ts-jest";
import tsConfig from "./tsconfig.json" assert { type: 'json' };

export default 
{
	...createDefaultPreset(),
	moduleNameMapper: pathsToModuleNameMapper(tsConfig.compilerOptions.paths, {prefix: "<rootDir>/"}),
}