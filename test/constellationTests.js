const expect = require('chai').expect;
const constellation = require('../lib/constellation');

const CATEGORIES = {"a":["a1","a2"],"b":["b1","b2","b3"],"c":["c1"]};
const ALEN = CATEGORIES.a.length;
const BLEN = CATEGORIES.b.length;
const CLEN = CATEGORIES.c.length;

const CATSTR = JSON.stringify(CATEGORIES);
const DESIGN_NAME = 'design';

const NODE = 'NODE';
const EDGE = 'EDGE';

const f = (a, b) => [].concat(...a.map(d => b.map(e => d.concat(',').concat(e))));
const cartesian = (a, b, ...c) => (b ? cartesian(f(a, b), ...c) : a);

function expectA(result) {
  expect(result.designs.length).to.equal(ALEN);
  expect(result.designs).to.have.members(CATEGORIES.a);
}

function expectAConcatB(result) {
  expect(result.designs.length).to.equal(ALEN + BLEN);
  expect(result.designs).to.have.members((CATEGORIES.a).concat(CATEGORIES.b));
}

function expectACartesianB(result) {
  expect(result.designs.length).to.equal(ALEN * BLEN);
  expect(result.designs).to.have.members(cartesian(CATEGORIES.a, CATEGORIES.b));
}

module.exports = function() {
  describe('Missing input errors', function() {
    it('Missing num designs', function () {
      expect(() => constellation.goldbar(DESIGN_NAME, '(a}', '{}', null, 0, NODE)).to.throw('Invalid number of designs');
      expect(() => constellation.goldbar(DESIGN_NAME, '(a}', '{}', null, 0, EDGE)).to.throw('Invalid number of designs');
    });

    it('Invalid num designs', function () {
      expect(() => constellation.goldbar(DESIGN_NAME, '(a}', '{}', 0, 0, NODE)).to.throw('Invalid number of designs');
      expect(() => constellation.goldbar(DESIGN_NAME, '(a}', '{}', 0, 0, EDGE)).to.throw('Invalid number of designs');
    });

    it('Invalid cycle depth', function () {
      expect(() => constellation.goldbar(DESIGN_NAME, '(a}', '{}', 10, -1, NODE)).to.throw('Invalid cycle depth');
      expect(() => constellation.goldbar(DESIGN_NAME, '(a}', '{}', 10, -1, EDGE)).to.throw('Invalid cycle depth');
    });

    it('Missing specification', function () {
      expect(() => constellation.goldbar(DESIGN_NAME, null, '{}', 10, 0, NODE)).to.throw('No input received')
      expect(() => constellation.goldbar(DESIGN_NAME, null, '{}', 10, 0, EDGE)).to.throw('No input received')
    });

    it('Missing design name', function () {
      expect(() => constellation.goldbar(null, '(a}', '{}', 10, 0, NODE)).to.throw('No design name is specified');
      expect(() => constellation.goldbar(null, '(a}', '{}', 10, 0, EDGE)).to.throw('No design name is specified');
    });

    it('Missing representation', function () {
      expect(() => constellation.goldbar(DESIGN_NAME, 'a', '{"a": ["a"]}', 10, 0)).to.throw('Invalid graph representation');
      expect(() => constellation.goldbar(DESIGN_NAME, 'a', '{"a": ["a"]}', 10, 0)).to.throw('Invalid graph representation');
    });
  });

  describe('Operator unit tests, base cases', function() {

    describe('Unary expressions', function() {
      it('atom', function() {
        let resultNode = constellation.goldbar(DESIGN_NAME, 'a', CATSTR, 10, 0, NODE);
        expectA(resultNode);
        let resultEdge = constellation.goldbar(DESIGN_NAME, 'a', CATSTR, 10, 0, EDGE);
        expectA(resultEdge);
      });

      it('one-or-more', function() {
        let resultNode = constellation.goldbar(DESIGN_NAME, 'one-or-more a', CATSTR, 10, 0, NODE);
        expectA(resultNode);
        expect(resultNode.paths.length).to.equal(1);

        let resultEdge = constellation.goldbar(DESIGN_NAME, 'one-or-more a', CATSTR, 10, 0, EDGE);
        expectA(resultEdge);
        expect(resultEdge.paths.length).to.equal(1);
        // expect(result.paths[0].type === ATOM);
      });

      it('zero-or-more', function() {
        const resultNode = constellation.goldbar(DESIGN_NAME, 'zero-or-more a', CATSTR, 10, 0, NODE);
        expectA(resultNode);
        const resultEdge = constellation.goldbar(DESIGN_NAME, 'zero-or-more a', CATSTR, 10, 0, EDGE);
        expectA(resultEdge);
        // TODO: state that empty string is not an option as an explicit design choice
      });
    });

    describe('Binary expressions', function() {
      // it('and', function() {
      //   let result = constellation.goldbar(DESIGN_NAME, 'a and a', CATSTR, 10, 0, NODE);
      //   expectA(result);
      //
      //   result = constellation.goldbar(DESIGN_NAME, 'a and b', CATSTR, 10, 0, NODE);
      //   expect(result.designs.length).to.equal(0);
      // });

      it('or', function() {
        let resultNode = constellation.goldbar(DESIGN_NAME, 'b or a', CATSTR, 10, 0, NODE);
        expectAConcatB(resultNode);
        let resultEdge = constellation.goldbar(DESIGN_NAME, 'b or a', CATSTR, 10, 0, EDGE);
        expectAConcatB(resultEdge);

        resultNode = constellation.goldbar(DESIGN_NAME, 'a or a', CATSTR, 10, 0, NODE);
        expectA(resultNode);
        resultEdge = constellation.goldbar(DESIGN_NAME, 'a or a', CATSTR, 10, 0, EDGE);
        expectA(resultEdge);
        // TODO: what should the graph be?
      });

      it('then', function() {
        let resultNode = constellation.goldbar(DESIGN_NAME, 'a then b', CATSTR, 10, 0, NODE);
        expectACartesianB(resultNode);
        let resultEdge = constellation.goldbar(DESIGN_NAME, 'a then b', CATSTR, 10, 0, EDGE);
        expectACartesianB(resultEdge);

        resultNode = constellation.goldbar(DESIGN_NAME, 'a . b', CATSTR, 10, 0, NODE);
        expectACartesianB(resultNode);
        resultEdge = constellation.goldbar(DESIGN_NAME, 'a . b', CATSTR, 10, 0, EDGE);
        expectACartesianB(resultEdge);
      });
    });
  });

  describe('Operator compositions', function() {
    describe('unary op (unary exp)', function() {
      it('one-or-more (one-or-more atom)', function() {
        const resultNode = constellation.goldbar(DESIGN_NAME, 'one-or-more (one-or-more a)', CATSTR, 10 , 0, NODE);
        expectA(resultNode);
        const resultEdge = constellation.goldbar(DESIGN_NAME, 'one-or-more (one-or-more a)', CATSTR, 10 , 0, EDGE);
        expectA(resultEdge);
      });

      // TODO: this graph looks wrong
      it('one-or-more (zero-or-more atom)', function() {
        const resultNode = constellation.goldbar(DESIGN_NAME, 'one-or-more (zero-or-more a)', CATSTR, 10 , 0, NODE);
        expectA(resultNode);
        const resultEdge = constellation.goldbar(DESIGN_NAME, 'one-or-more (zero-or-more a)', CATSTR, 10 , 0, EDGE);
        expectA(resultEdge);
      });

      it('zero-or-more (zero-or-more atom)', function() {
        const resultNode = constellation.goldbar(DESIGN_NAME, 'zero-or-more (zero-or-more a)', CATSTR, 10 , 0, NODE);
        expectA(resultNode);
        const resultEdge = constellation.goldbar(DESIGN_NAME, 'zero-or-more (zero-or-more a)', CATSTR, 10 , 0, EDGE);
        expectA(resultEdge);
      });

      it('zero-or-more (one-or-more atom)', function() {
        const resultNode = constellation.goldbar(DESIGN_NAME, 'zero-or-more (one-or-more a)', CATSTR, 10 , 0, NODE);
        expectA(resultNode);
        const resultEdge = constellation.goldbar(DESIGN_NAME, 'zero-or-more (one-or-more a)', CATSTR, 10 , 0, EDGE);
        expectA(resultEdge);
      });
    });


    describe('unary-op (binary-exp)', function() {
      // zero-or-more
      it('zero-or-more (atom or atom)', function() {
        const resultNode = constellation.goldbar(DESIGN_NAME, 'zero-or-more (a or b)', CATSTR, 10 , 0, NODE);
        expectAConcatB(resultNode);
        const resultEdge = constellation.goldbar(DESIGN_NAME, 'zero-or-more (a or b)', CATSTR, 10 , 0, EDGE);
        expectAConcatB(resultEdge);
      });

      // it('zero-or-more (atom and atom)', function() {
      //   const resultNode = constellation.goldbar(DESIGN_NAME, 'zero-or-more (a and a)', CATSTR, 10 , 0, NODE);
      //   expectA(resultNode);
      //   const resultEdge = constellation.goldbar(DESIGN_NAME, 'zero-or-more (a and a)', CATSTR, 10 , 0, EDGE);
      //   expectA(resultEdge);
      // });

      it('zero-or-more (atom then atom)', function() {
        const resultNode = constellation.goldbar(DESIGN_NAME, 'zero-or-more (a then b)', CATSTR, 10 , 0, NODE);
        expectACartesianB(resultNode);
        const resultEdge = constellation.goldbar(DESIGN_NAME, 'zero-or-more (a then b)', CATSTR, 10 , 0, EDGE);
        expectACartesianB(resultEdge);
      });

      // one-or-more
      it('one-or-more (atom or atom)', function() {
        const resultNode = constellation.goldbar(DESIGN_NAME, 'one-or-more (a or c)', CATSTR, 10 , 0, NODE);
        expect(resultNode.designs.length).to.equal(((ALEN * CLEN) * 2) + ALEN + CLEN);
        const resultEdge = constellation.goldbar(DESIGN_NAME, 'one-or-more (a or c)', CATSTR, 10 , 0, EDGE);
        expect(resultEdge.designs.length).to.equal(((ALEN * CLEN) * 2) + ALEN + CLEN);
      });

      // it('one-or-more (atom and atom)', function() {
      //   const resultNode = constellation.goldbar(DESIGN_NAME, 'one-or-more (a and a)', CATSTR, 10 , 0, NODE);
      //   expectA(resultNode);
      //   const resultEdge = constellation.goldbar(DESIGN_NAME, 'one-or-more (a and a)', CATSTR, 10 , 0, EDGE);
      //   expectA(resultEdge);
      // });

      it('one-or-more (atom then atom)', function() {
        const resultNode = constellation.goldbar(DESIGN_NAME, 'one-or-more (a then b)', CATSTR, 10 , 0, NODE);
        expectACartesianB(resultNode);
        const resultEdge = constellation.goldbar(DESIGN_NAME, 'one-or-more (a then b)', CATSTR, 10 , 0, EDGE);
        expectACartesianB(resultEdge);
      });
    });

    describe('(binary-exp) binary-op (atom)', function() {
      // Or
      it('(atom or atom) or atom', function() {
        let resultNode = constellation.goldbar(DESIGN_NAME, 'a or b or c', CATSTR, 10 , 0, NODE);
        expect(resultNode.designs.length).to.equal(ALEN + BLEN + CLEN);
        expect(resultNode.designs).to.have.members((CATEGORIES.c).concat(CATEGORIES.b).concat(CATEGORIES.a));
        let resultEdge = constellation.goldbar(DESIGN_NAME, 'a or b or c', CATSTR, 10 , 0, EDGE);
        expect(resultEdge.designs.length).to.equal(ALEN + BLEN + CLEN);
        expect(resultEdge.designs).to.have.members((CATEGORIES.c).concat(CATEGORIES.b).concat(CATEGORIES.a));

        resultNode = constellation.goldbar(DESIGN_NAME, 'a or a or b', CATSTR, 10 , 0, NODE);
        expectAConcatB(resultNode);
        resultEdge = constellation.goldbar(DESIGN_NAME, 'a or a or b', CATSTR, 10 , 0, EDGE);
        expectAConcatB(resultEdge);
      });

      // it('(atom or atom) and atom', function() {
      //   const result = constellation.goldbar(DESIGN_NAME, '(a or c) and a', CATSTR, 10 , 0, NODE);
      //   expectA(result);
      // });

      it('(atom or atom) then atom', function() {
        const resultNode = constellation.goldbar(DESIGN_NAME, '(a or b) then c', CATSTR, 10 , 0, NODE);
        expect(resultNode.designs.length).to.equal((ALEN * CLEN) + (BLEN * CLEN));
        expect(resultNode.designs).to.have.members((cartesian(CATEGORIES.b, CATEGORIES.c)).concat(cartesian(CATEGORIES.a, CATEGORIES.c)));

        const resultEdge = constellation.goldbar(DESIGN_NAME, '(a or b) then c', CATSTR, 10 , 0, EDGE);
        expect(resultEdge.designs.length).to.equal((ALEN * CLEN) + (BLEN * CLEN));
        expect(resultEdge.designs).to.have.members((cartesian(CATEGORIES.b, CATEGORIES.c)).concat(cartesian(CATEGORIES.a, CATEGORIES.c)));
      });

      // And
      // it('(atom and atom) or atom', function() {
      //   const result = constellation.goldbar(DESIGN_NAME, '(a or b) then c', CATSTR, 10 , 0, NODE);
      //   expect(result.designs.length).to.equal((ALEN * CLEN) + (BLEN * CLEN));
      //   expect(result.designs).to.have.members((cartesian(CATEGORIES.b, CATEGORIES.c)).concat(cartesian(CATEGORIES.a, CATEGORIES.c)));
      // });

      // it('(atom and atom) and atom', function() {
      //   let result = constellation.goldbar(DESIGN_NAME, '(a and a) and a', CATSTR, 10 , 0, NODE);
      //   expectA(result);
      //
      //   result = constellation.goldbar(DESIGN_NAME, '(a and a) and b', CATSTR, 10 , 0, NODE);
      //   expect(result.designs.length).to.equal(0);
      // });

      // it('(atom and atom) then atom', function() {
      //   const result = constellation.goldbar(DESIGN_NAME, '(a and a) then b', CATSTR, 10 , 0, NODE);
      //   expectACartesianB(result);
      // });

      // Then
      it('(atom then atom) or atom', function() {
        const resultNode = constellation.goldbar(DESIGN_NAME, '(a then b) or c', CATSTR, 10 , 0, NODE);
        expect(resultNode.designs.length).to.equal((ALEN * BLEN) + CLEN);
        expect(resultNode.designs).to.have.members((CATEGORIES.c).concat(cartesian(CATEGORIES.a, CATEGORIES.b)));

        const resultEdge = constellation.goldbar(DESIGN_NAME, '(a then b) or c', CATSTR, 10 , 0, EDGE);
        expect(resultEdge.designs.length).to.equal((ALEN * BLEN) + CLEN);
        expect(resultEdge.designs).to.have.members((CATEGORIES.c).concat(cartesian(CATEGORIES.a, CATEGORIES.b)));
      });

      it('(atom then atom) then atom', function() {
        const resultNode = constellation.goldbar(DESIGN_NAME, '(a then b) then c', CATSTR, 10 , 0, NODE);
        expect(resultNode.designs.length).to.equal(ALEN * BLEN * CLEN);
        expect(resultNode.designs).to.have.members(cartesian(CATEGORIES.a, CATEGORIES.b, CATEGORIES.c));

        const resultEdge = constellation.goldbar(DESIGN_NAME, '(a then b) then c', CATSTR, 10 , 0, EDGE);
        expect(resultEdge.designs.length).to.equal(ALEN * BLEN * CLEN);
        expect(resultEdge.designs).to.have.members(cartesian(CATEGORIES.a, CATEGORIES.b, CATEGORIES.c));
      });

      // it('(atom then atom) and atom', function() {
      //   const result = constellation.goldbar(DESIGN_NAME, '(a then b) and a', CATSTR, 10 , 0, NODE);
      //   expectA(result);
      // });
    });

    describe('(atom) binary-op (unary-exp)', function() {
      // OR
      it('atom or (one-or-more atom)', function() {
        const resultNode = constellation.goldbar(DESIGN_NAME, 'a or (one-or-more b)', CATSTR, 10 , 0, NODE);
        expectAConcatB(resultNode);
        const resultEdge = constellation.goldbar(DESIGN_NAME, 'a or (one-or-more b)', CATSTR, 10 , 0, EDGE);
        expectAConcatB(resultEdge);
      });

      it('atom or (zero-or-more atom)', function() {
        const resultNode = constellation.goldbar(DESIGN_NAME, 'a or (zero-or-more b)', CATSTR, 10 , 0, NODE);
        expectAConcatB(resultNode);
        const resultEdge = constellation.goldbar(DESIGN_NAME, 'a or (zero-or-more b)', CATSTR, 10 , 0, EDGE);
        expectAConcatB(resultEdge);
      });

      // AND
      // it('atom and (zero-or-more atom)', function() {
      //   const result = constellation.goldbar(DESIGN_NAME, 'a and (zero-or-more a)', CATSTR, 10 , 0, NODE);
      //   expectA(result);
      // });
      //
      // it('atom and (zero-or-more atom)', function() {
      //   const result = constellation.goldbar(DESIGN_NAME, 'a and (one-or-more a)', CATSTR, 10 , 0, NODE);
      //   expectA(result);
      // });

      // THEN
      it('atom then (zero-or-more atom)', function() {
        const resultNode = constellation.goldbar(DESIGN_NAME, 'a then (one-or-more b)', CATSTR, 10 , 0, NODE);
        expectACartesianB(resultNode);
        const resultEdge = constellation.goldbar(DESIGN_NAME, 'a then (one-or-more b)', CATSTR, 10 , 0, EDGE);
        expectACartesianB(resultEdge);
      });

      it('atom then (zero-or-more atom)', function() {
        const resultNode = constellation.goldbar(DESIGN_NAME, 'a then (one-or-more b)', CATSTR, 10 , 0, NODE);
        expectACartesianB(resultNode);
        const resultEdge = constellation.goldbar(DESIGN_NAME, 'a then (one-or-more b)', CATSTR, 10 , 0, EDGE);
        expectACartesianB(resultEdge);
      });
    });
  });


  describe('Cycles', function () {
    it('atom', function() {
      let resultNode = constellation.goldbar(DESIGN_NAME, 'c', CATSTR, 10, 2, NODE);
      expect(resultNode.designs.length).to.equal(CLEN);
      let resultEdge = constellation.goldbar(DESIGN_NAME, 'c', CATSTR, 10, 2, EDGE);
      expect(resultEdge.designs.length).to.equal(CLEN);
    });

    it('zero-or-more', function() {
      const resultNode = constellation.goldbar(DESIGN_NAME, 'zero-or-more a', CATSTR, 10, 1, NODE);
      expect(resultNode.designs.length).to.equal(ALEN + ALEN * ALEN);
      expect(resultNode.designs).to.contain('a1');
      expect(resultNode.designs).to.contain('a2');
      expect(resultNode.designs).to.contain('a1,a1');
      expect(resultNode.designs).to.contain('a1,a2');
      expect(resultNode.designs).to.contain('a2,a1');
      expect(resultNode.designs).to.contain('a2,a2');
      expect(resultNode.paths.length).to.equal(2);

      const resultEdge = constellation.goldbar(DESIGN_NAME, 'zero-or-more a', CATSTR, 10, 1, EDGE);
      expect(resultEdge.designs.length).to.equal(ALEN + ALEN * ALEN);
      expect(resultEdge.designs).to.contain('a1');
      expect(resultEdge.designs).to.contain('a2');
      expect(resultEdge.designs).to.contain('a1,a1');
      expect(resultEdge.designs).to.contain('a1,a2');
      expect(resultEdge.designs).to.contain('a2,a1');
      expect(resultEdge.designs).to.contain('a2,a2');
      expect(resultEdge.paths.length).to.equal(2);
    });
  });

  describe('Sanitise category input', function () {
    it('empty categories', function () {
      expect(() => constellation.goldbar(DESIGN_NAME, 'a', '{}', 10, 0, NODE)).to.throw('a is not defined in categories');
      expect(() => constellation.goldbar(DESIGN_NAME, 'a', '{}', 10, 0, EDGE)).to.throw('a is not defined in categories');
    });

    it('handle defined but empty category', function () {
      const resultNode = constellation.goldbar(DESIGN_NAME, 'a', '{"a": []}', 10, 0, NODE);
      expect(JSON.stringify(resultNode.designs)).to.equal('[]');
      const resultEdge = constellation.goldbar(DESIGN_NAME, 'a', '{"a": []}', 10, 0, EDGE);
      expect(JSON.stringify(resultEdge.designs)).to.equal('[]');
    });

    it('mismatched brackets', function () {
      expect(() => constellation.goldbar(DESIGN_NAME, '(a}', '{}', 10, 0, NODE)).to.throw('Parsing error!');
      expect(() => constellation.goldbar(DESIGN_NAME, '(a}', '{}', 10, 0, EDGE)).to.throw('Parsing error!');
    });
  });

  describe('Invalid characters', function () {
    it('Whitespace should not be included in designs', function () {
      const resultNode = constellation.goldbar(DESIGN_NAME, 'a', '{"a":["\ta1", " a2"]}', 10, 0, NODE);
      expect(JSON.stringify(resultNode.designs)).to.contain('a1');
      expect(JSON.stringify(resultNode.designs)).to.contain('a2');

      const resultEdge = constellation.goldbar(DESIGN_NAME, 'a', '{"a":["\ta1", " a2"]}', 10, 0, EDGE);
      expect(JSON.stringify(resultEdge.designs)).to.contain('a1');
      expect(JSON.stringify(resultEdge.designs)).to.contain('a2');
    });

    it('Other symbols should be parsed into category', function () {
      const resultNode = constellation.goldbar(DESIGN_NAME, 'a', '{"a":["$a1", "a2"]}', 10, 0, NODE);
      expect(JSON.stringify(resultNode.designs)).to.contain('a1');
      expect(JSON.stringify(resultNode.designs)).to.contain('a2');

      const resultEdge = constellation.goldbar(DESIGN_NAME, 'a', '{"a":["$a1", "a2"]}', 10, 0, EDGE);
      expect(JSON.stringify(resultEdge.designs)).to.contain('a1');
      expect(JSON.stringify(resultEdge.designs)).to.contain('a2');
    });
  });


  describe('Sanitise specification input', function () {
    it('Atom not in categories', function () {
      expect(() => constellation.goldbar(DESIGN_NAME, 'd', CATSTR, 10, 0, NODE)).to.throw('d is not defined in categories');
      expect(() => constellation.goldbar(DESIGN_NAME, 'd', CATSTR, 10, 0, EDGE)).to.throw('d is not defined in categories');
    });

    it('Mismatched brackets', function () {
      expect(() => constellation.goldbar(DESIGN_NAME, '(a}', CATSTR, 10, 0, NODE)).to.throw('Parsing error!');
      expect(() => constellation.goldbar(DESIGN_NAME, '(a}', CATSTR, 10, 0, EDGE)).to.throw('Parsing error!');
    });

    describe('Invalid characters', function () {
      it('Tabs used should not throw errors', function () {
        const resultNode = constellation.goldbar(DESIGN_NAME, '\ta', CATSTR, 10, 0, NODE);
        expect(resultNode.designs).to.contain('a1');
        expect(resultNode.designs).to.contain('a2');

        const resultEdge = constellation.goldbar(DESIGN_NAME, '\ta', CATSTR, 10, 0, EDGE);
        expect(resultEdge.designs).to.contain('a1');
        expect(resultEdge.designs).to.contain('a2');
      });

      // it('$', function () {
      //   expect(() => constellation.goldbar(DESIGN_NAME, 'a then $a', CATSTR, 10)).to.throw('Parsing error!');
      // });
      // TODO turn back on when imparse starts throwing errors

      it('_', function () {
        expect(() => constellation.goldbar(DESIGN_NAME, '_a', CATSTR, 10, 0, NODE)).to.throw('_a is not defined in categories');
        expect(() => constellation.goldbar(DESIGN_NAME, '_a', CATSTR, 10, 0, EDGE)).to.throw('_a is not defined in categories');
      });
    });

  });



  //   it('Multiple one-or-more', function() {
  //     const result = constellation.goldbar(DESIGN_NAME, 'one-or-more (one-or-more a)', CATSTR, 10, 1);
  //     expect(result.designs.length).to.equal(ALEN + ALEN * ALEN);
  //     expect(result.designs).to.contain('a1');
  //     expect(result.designs).to.contain('a2');
  //     expect(result.designs).to.contain('a1,a1');
  //     expect(result.designs).to.contain('a1,a2');
  //     expect(result.designs).to.contain('a2,a1');
  //     expect(result.designs).to.contain('a2,a2');
  //     expect(result.paths.length).to.equal(2);
  //   });

  //   it('Multiple zero-or-more', function() {
  //     const result = constellation.goldbar(DESIGN_NAME, 'zero-or-more (zero-or-more a)', CATSTR, 10, 1);
  //     expect(result.designs.length).to.equal(ALEN + ALEN * ALEN);
  //     expect(result.designs).to.contain('a1');
  //     expect(result.designs).to.contain('a2');
  //     expect(result.designs).to.contain('a1,a1');
  //     expect(result.designs).to.contain('a1,a2');
  //     expect(result.designs).to.contain('a2,a1');
  //     expect(result.designs).to.contain('a2,a2');
  //     expect(result.paths.length).to.equal(2);
  //   });

  //   it('Then downstream from cycle', function() {
  //     const result = constellation.goldbar(DESIGN_NAME, 'zero-or-more a then b', CATSTR, 50, 1);
  //     expect(result.designs.length).to.equal(BLEN + ALEN * BLEN + ALEN * ALEN * BLEN);
  //   });

  // });
};
