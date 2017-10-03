import * as mocha from "mocha";
import { suite, test, context } from "./index";

let calls = 0;

@suite class Hello {
    @context mocha: mocha.IBeforeAndAfterContext & mocha.IHookCallbackContext;
    // Get the mocha context for static before and after.
    @context static mocha: mocha.IBeforeAndAfterContext & mocha.IHookCallbackContext;

    before() {
        this.mocha.retries(3);
    }
    
    @test world() {
        console.log('calls', calls);
        calls++;
        throw new Error('should fail');
    }
}
