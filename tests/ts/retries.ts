import * as mocha from "mocha";
import { suite, test, context } from "../../index";

@suite('retries') class RetriesTest {
    // Get the mocha context in for instance before and after (before/after each) and test methods.
    @context mocha: mocha.IBeforeAndAfterContext & mocha.IHookCallbackContext;

    // Get the mocha context for static before and after.
    @context static mocha: mocha.IBeforeAndAfterContext & mocha.IHookCallbackContext;

    static before() {
        this.mocha.retries(1);   
    }

    @test "retried once"() {
        console.log("test");
        throw new Error("should fail");
    }
}
