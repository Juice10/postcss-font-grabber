import gulp from "gulp";
import postcss from "gulp-postcss";
import { join } from "path";
import { sync as rimraf } from "rimraf";
import { postcssFontGrabber } from "../../../src";
import { Job } from "../../../src/contracts";

const fixturesDirectoryPath = join(__dirname, "fixtures");
const OutputsDirectoryPath = join(__dirname, "outputs/dist");

const CssSrcDir = join(fixturesDirectoryPath, "basic-example");
const GulpDestDir = OutputsDirectoryPath;
const CssDestDir = join(OutputsDirectoryPath, "/css");
const CssDestFontDir = join(OutputsDirectoryPath, "/css/font");

describe("Basic Gulp integration example", () => {
  beforeEach(() => rimraf(OutputsDirectoryPath));
  afterEach(() => rimraf(OutputsDirectoryPath));

  it("should works", (done) => {
    const expectedFontUrls = [
      "https://fonts.gstatic.com/s/roboto/v20/KFOkCnqEu92Fr1MmgVxFIzIXKMnyrYk.woff2",
      "https://fonts.gstatic.com/s/notosanstc/v11/-nFlOG829Oofr2wohFbTp9i9WyEKIfVZ15Ls5XOFrksA2xrfz7uqxBF_ije-Lcrp9hfGsGeZ-W5oyw.0.woff2",
      "https://fonts.gstatic.com/s/pottaone/v3/FeVSS05Bp6cy7xI-YfxQ2J5hm24c1sY_XjjYC1QMPbpH11Hj8t620eOL.3.woff2",
    ];
    const expectedCssFiles = [
      join(CssSrcDir, "desktop.css"),
      join(CssSrcDir, "mobile.css"),
    ];

    const fontDownloader = jest.fn().mockImplementation((job) => {
      return {
        job,
        download: {
          size: 100,
        },
      };
    });

    gulp
      .src(join(CssSrcDir, `/**/*.css`))
      .pipe(
        postcss([
          postcssFontGrabber({
            cssSrc: CssSrcDir,
            cssDest: CssDestDir,
            fontDir: CssDestFontDir,
            mkdir: true,
            fontDownloader,
          }),
        ])
      )
      .pipe(gulp.dest(GulpDestDir))
      .on("end", () => {
        expect(fontDownloader.mock.calls.length).toBe(3);
        for (const call of fontDownloader.mock.calls) {
          const job: Job = call[0];
          expect(
            expectedFontUrls.includes(job.remoteFont.urlObject.href)
          ).toBeTruthy();
          expect(expectedCssFiles.includes(job.css.sourcePath)).toBeTruthy();
        }

        done();
      });
  });
});