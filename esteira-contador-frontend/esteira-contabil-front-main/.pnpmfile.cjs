// .pnpmfile.cjs
/** @type {import('pnpm').Config['hooks']} */
module.exports = {
    readPackage(pkg) {
      if (pkg.name === 'dnd') {
        delete pkg.scripts?.postinstall;   // remove o prompt
      }
      return pkg;
    }
  };
