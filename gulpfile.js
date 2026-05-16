import { deleteAsync } from 'del';
import gulp from 'gulp';
import changed from 'gulp-changed';
import plumber from 'gulp-plumber';
import terser from 'gulp-terser';
import ts from 'gulp-typescript';

const paths = {
	scripts: {
		src: ['src/**/*.ts', '!src/**/*.d.ts'],
		dst: './dst',
		dist: './dist',
	},
};

const tsProject = ts.createProject('./src/tsconfig.json');

function typeScripts() {
	const tsResult = gulp
		.src(paths.scripts.src)
		.pipe(plumber())
		.pipe(changed('.', { extension: '.js' }))
		.pipe(tsProject());

	return tsResult.js.pipe(plumber()).pipe(gulp.dest(paths.scripts.dst));
}

const clean = () => deleteAsync([paths.scripts.dist]);

const compress = () => {
	return gulp
		.src([`${paths.scripts.dst}/*.js`, `!${paths.scripts.dst}/interfaces.js`])
		.pipe(plumber())
		.pipe(terser())
		.pipe(gulp.dest(paths.scripts.dist));
};

function watch() {
	gulp.watch(paths.scripts.src, gulp.series(typeScripts));
}

gulp.task('clean', clean);
gulp.task('ts', typeScripts);
gulp.task('default', gulp.series(typeScripts, watch));
gulp.task('build', gulp.series(clean, typeScripts, compress));
