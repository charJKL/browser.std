// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.strictTypeChecked,
	{
		ignores: ["dist/**"]
	},
	{
		files: ['**/*.{ts,tsx,mts,cts}'],
		rules: {
			'no-undef': 'off',
		},
  },
	{
		languageOptions: 
		{
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		}
	}
);