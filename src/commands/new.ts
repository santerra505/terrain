import { Command, flags } from "@oclif/command";
import { execSync } from "child_process";
import * as fs from "fs-extra";
import * as request from "superagent";
import * as Zip from "adm-zip";
import cli from "cli-ux";
import * as path from "path";
export default class New extends Command {
  static description = "Create new dapp from template.";

  static examples = [
    "$ terrain new awesome-dapp",
    "$ terrain new awesome-dapp --path path/to/dapp",
  ];

  static flags = {
    path: flags.string({ description: "path to keep the project" }),
    version: flags.string({
      default: "0.16",
    }),
  };

  static args = [{ name: "name", required: true }];

  async run() {

    const { args, flags } = this.parse(New);

    cli.log("generating: ");
    // ------------------------------- Scaffolding
    cli.action.start("- contract");

    if (flags.path) {

      console.log(`[ new.ts ]: changed dir to ${flags.path} `)
      process.chdir(flags.path);
    }

    console.log(`[ new.ts ]: created dir: ${args.name} `)
    fs.mkdirSync(args.name);
    process.chdir(args.name);

    fs.mkdirSync("contracts");
    process.chdir("contracts");

    // ------------------------------- Contract template
    // https://github.com/InterWasm/cw-template/archive/refs/heads/main.zip

    console.log("Generating cargo template via git download. rEVAMP")

    const repoName     = "cw-template"
    const branch       = "main";

    const contractFile = fs.createWriteStream("contract.zip");
    await new Promise((resolve, reject) => {
      request
        .get(`https://github.com/InterWasm/${repoName}/archive/refs/heads/${branch}.zip`)
        .on("error", (error) => {reject(error);})
        .pipe(contractFile)
        .on("finish", () => {cli.action.stop();resolve(null);});
    });

    const contractZip = new Zip("contract.zip");
    contractZip.extractAllTo(".", true);

    fs.renameSync(`${repoName}-${branch}`, "counter");
    fs.removeSync("contract.zip");

    process.chdir("..");
    cli.action.stop();

    // ------------------------------- Frontend template
    cli.action.start("- frontend");
    const file = fs.createWriteStream("frontend.zip");
    await new Promise((resolve, reject) => {
      request
        .get("https://github.com/terra-money/terrain-frontend-template/archive/refs/heads/main.zip")
        .on("error", (error) => {reject(error);})
        .pipe(file)
        .on("finish", () => {cli.action.stop();resolve(null);});
    });

    const zip = new Zip("frontend.zip");
    zip.extractAllTo(".", true);
    fs.renameSync("terrain-frontend-template-main", "frontend");
    fs.removeSync("frontend.zip");

    fs.copySync(path.join(__dirname, "..", "template"), process.cwd());
  }
}
