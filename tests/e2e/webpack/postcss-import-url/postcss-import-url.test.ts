import webpack from 'webpack';
import { join } from 'path';
import { postcssFontGrabber } from '../../../../src';
import { Readable } from 'stream';
import { sync as rimraf } from 'rimraf';

jest.mock('http-https');

const fixturesDirectoryPath = join(__dirname, 'fixtures');
const OutputsDirectoryPath = join(__dirname, 'outputs/dist');

const WebpackDestDir = OutputsDirectoryPath;
const CssDestFontDir = join(OutputsDirectoryPath, '/css/font');

describe(`webpack - works with postcss-import-url`, () => {
  beforeEach(() => rimraf(OutputsDirectoryPath));
  afterEach(() => rimraf(OutputsDirectoryPath));

  it('should works', done => {
    const CssSrcDir = fixturesDirectoryPath;

    const mockDownloader = jest.fn().mockImplementation(fontSpec => {
      const data = Readable.from([
        `file:${fontSpec.css.sourceFile}\n`,
        `url:${fontSpec.parsedSrc.urlObject.href}`,
      ]);

      return {
        data,
        mimeType: undefined,
      };
    });

    const compiler = webpack({
      mode: 'production',
      entry: join(CssSrcDir, 'app.js'),
      module: {
        rules: [
          {
            test: /\.css$/i,
            use: [
              'style-loader',
              'css-loader',
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions: {
                    plugins: [
                      [
                        'postcss-import-url',
                        {
                          modernBrowser: true,
                        },
                      ],
                      postcssFontGrabber({
                        cssSrc: CssSrcDir,
                        cssDest: CssSrcDir,
                        fontDest: CssDestFontDir,
                        downloader: mockDownloader,
                      }),
                    ],
                  },
                },
              },
            ],
          },
          {
            test: /\.(woff|woff2|eot|ttf|otf)$/,
            use: ['file-loader'],
          },
        ],
      },
      output: {
        path: WebpackDestDir,
        filename: 'app.bundle.js',
      },
    });

    compiler.run((err, stats) => {
      expect(err).toBeNull();
      expect(stats).not.toBeUndefined();

      if (stats!.hasErrors()) {
        console.log('ERRORS', stats!.toJson().errors);
      }

      expect(stats!.hasErrors()).toBeFalsy();

      done();
    });
  });
});
