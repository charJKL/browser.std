import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ["dist/**", "*.config.mjs"]
	},
	eslint.configs.recommended,
	...tseslint.configs.strictTypeChecked,
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