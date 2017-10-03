import { suite, test, slow, timeout, pending, only } from "./index";
import { assert } from "chai";
import { spawnSync } from "child_process";
import * as path from "path";
import * as rimraf from "rimraf";

var chai = require("chai");
var fs = require("fs");

function assertOutput(actualStr, expectedStr) {
    let actual: string[] = actualStr.split("\n");
    let expected: string[] = expectedStr.split("\n");

    for(var i = 0; i < expected.length; i++) {
        if (actual.length <= i) {
            throw new Error("Actual output is shorter than expected, acutal lines: " + actual.length + ", expected: " + expected.length);
        }
        let expectedLine = expected[i].trim();
        let actualLine = actual[i].trim();
        if (actualLine.indexOf(expectedLine) === -1) {
            throw new Error("Unexpected output. Expected: '" + expectedLine + "' to be contained in '" + actualLine + "'");
        }
    }
}

@suite.only("typescript", slow(5000), timeout(15000))
class SuiteTest {

    @test("target v1 es5") es5() {
        this.run("es5", "test.suite");
    }

    @test("target v1 es6") es6() {
        this.run("es6", "test.suite");
    }

    @test("target v2 es5") v2es5() {
        this.run("es5", "test.v2.suite");
    }

    @test("target v2 es6") v2es6() {
        this.run("es6", "test.v2.suite");
    }

    @test "only v2 suite es5"() {
        this.run("es5", "only.v2.suite");
    }

    @test "only v2 suite es6"() {
        this.run("es6", "only.v2.suite");
    }

    @test "pending v2 suite es5"() {
        this.run("es5", "pending.v2.suite");
    }

    @test "pending v2 suite es6"() {
        this.run("es6", "pending.v2.suite");
    }

    @test "only suite es5"() {
        this.run("es5", "only.suite");
    }

    @test "only suite es6"() {
        this.run("es6", "only.suite");
    }

    @test "pending suite es5"() {
        this.run("es5", "pending.suite");
    }

    @test "pending suite es6"() {
        this.run("es6", "pending.suite");
    }

    @test "context suite es6"() {
        this.run("es6", "context.suite");
    }

    @test.only() "retries suite es6"() {
        this.run("es6", "retries");
    }

    private run(target: string, ts: string) {
        let tsc = spawnSync("node", ["./node_modules/typescript/bin/tsc", "--experimentalDecorators", "--module", "commonjs", "--target", target, "--lib", "es6", "tests/ts/" + ts + ".ts"]);

        // console.log(tsc.stdout.toString());
        assert.equal(tsc.stdout.toString(), "", "Expected error free tsc.");
        assert.equal(tsc.status, 0);

        let mocha = spawnSync("node", ["./node_modules/mocha/bin/_mocha", "tests/ts/" + ts + ".js"]);
        // To debug any actual output while developing:
        // assert(mocha.status !== 0);

        // console.log(mocha.stderr.toString());

        let actual = mocha.stdout.toString();
        let expected = fs.readFileSync("./tests/ts/" + ts + ".expected.txt", "utf-8");

        // To patch the expected use the output of this, but clean up times and callstacks:
        // console.log("=====\n" + actual + "\n=====");

        assertOutput(actual, expected);
    }
}

// These integration tests are slow, you can uncommend the skip version below during development
// @suite.skip(timeout(90000))
@suite(timeout(90000), slow(10000))
class PackageTest {

    static tgzPath: string;

    @test "can be consumed as module"() {
        this.testPackage("module-usage", false);
    }

    @test "can be consumed as custom ui"() {
        this.testPackage("custom-ui", false);
    }

    @test "readme followed custom ui"() {
        this.testPackage("setting-up", false);
    }

    @test "can be consumed as module with @types/mocha"() {
        this.testPackage("module-usage", true);
    }

    @test "can be consumed as custom ui with @types/mocha"() {
        this.testPackage("custom-ui", true);
    }

    @test "readme followed custom ui with @types/mocha"() {
        this.testPackage("setting-up", true);
    }

    @timeout(30000)
    static before() {
        let pack = spawnSync("npm", ["pack"]);
        assert.equal(pack.stderr.toString(), "");
        assert.equal(pack.status, 0, "npm pack failed.");
        const lines = (<string>pack.stdout.toString()).split("\n").filter(line => !!line);
        assert.isAtLeast(lines.length, 1, "Expected atleast one line of output from npm pack with the .tgz name.");
        PackageTest.tgzPath = path.resolve(lines[lines.length - 1]);
    }

    private testPackage(packageName: string, installTypesMocha: boolean = false): void {
        let cwd;
        let npmtest;
        let actual;
        try {
            cwd = path.resolve("tests/repo", packageName);
            rimraf.sync(path.join(cwd, "node_modules"));

            let npmi = spawnSync("npm", ["i", "--no-package-lock"], { cwd });
            assert.equal(npmi.status, 0, "'npm i' failed.");

            let args: string[];
            if (installTypesMocha) {
                args = ["i", PackageTest.tgzPath, "@types/mocha", "--no-save", "--no-package-lock"];
            } else {
                args = ["i", PackageTest.tgzPath, "--no-save", "--no-package-lock"];
            }

            let npmitgz = spawnSync("npm", args, { cwd });
            assert.equal(npmitgz.status, 0, "'npm i <tgz>' failed.");

            npmtest = spawnSync("npm", ["test"], { cwd });
            actual = npmtest.stdout.toString();

            let expected = fs.readFileSync(cwd + "/expected.txt", "utf-8");
            assertOutput(actual, expected);
        } catch(e) {
            try {
                console.log("=====\n" + actual + "\n=====");
                console.log(npmtest.stderr.toString());
            } catch(ee) {}
            throw e;
        }
    }
}
