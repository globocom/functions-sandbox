class SandboxInternalException extends Error {
    constructor(ex) {
        super(ex.message);
        this.name = ex.name; 
        this.message = ex.message; 
        this.ex = ex
    }
}

module.exports = SandboxInternalException