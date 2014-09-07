var fs = require('fs');
var s = fs.separator;

// Parse arguments passed in from the grunt task
var args = JSON.parse(phantom.args[0]);

var viewportSize = {
    width: args.viewportSize[0],
    height: args.viewportSize[1]
};

// Messages are sent to the parent by appending them to the tempfile
var sendMessage = function() {
    fs.write(args.tempFile, JSON.stringify(Array.prototype.slice.call(arguments)) + '\n', 'a');
};

// Initialise CasperJs
var phantomCSSPath = args.phantomCSSPath;
phantom.casperPath = phantomCSSPath+s+'CasperJs';
phantom.injectJs(phantom.casperPath+s+'bin'+s+'bootstrap.js');

var casper = require('casper').create({
    viewportSize: viewportSize,
    logLevel: args.logLevel,
    verbose: true
});

// Require and initialise PhantomCSS module
var phantomcss = require(phantomCSSPath+s+'phantomcss.js');

phantomcss.init({
    screenshotRoot: args.screenshots,
    failedComparisonsRoot: args.failures,
    libraryRoot: phantomCSSPath, // Give absolute path, otherwise PhantomCSS fails

    onFail: function(test) {
        sendMessage('onFail', test);
    },
    onPass: function(test) {
        sendMessage('onPass', test);
    },
    onTimeout: function(test) {
        sendMessage('onTimeout', test);
    },
    onComplete: function(allTests, noOfFails, noOfErrors) {
        sendMessage('onComplete', allTests, noOfFails, noOfErrors);
    }
});

// Screenshot the KSS components
var data = require(args.testElements),
    selector,
    refSection,
    name,
    actionSelector;

casper.start();
phantomcss.turnOffAnimations();
phantomcss.update({
  fileNameGetter: function (root, fileName) {
    var name;

    fileName = fileName || 'screenshot';
    name = root + fs.separator + fileName;

    if (fs.isFile(name + '.png')) {
      return name + '.diff.png';
    } else {
      return name + '.png';
    }
  }
});

function uniqueSelector (refSection, selector) {
  return '[data-ksstest-section="' + refSection.replace(/([.])/g,'.')
          + '"] ' + selector.replace(/([:])/g, '.pseudo-class-');
}

function capture (selector, name) {
  casper.then(function () {
    phantomcss.screenshot(selector, name);
  });
}

function actThenCapture (action, actionSelector, selector, name) {
  casper.then(function () {
    switch (action) {
      case 'click':
        casper.click(actionSelector);
        break;
      case 'hover':
        casper.mouseover(selector);
        break;
    }
    phantomcss.screenshot(selector, name);
  });
}

// take screenshots of all elements
data.sections.forEach(function (section) {
  casper.thenOpen(data.root + '/section-' + section.section + '.html');
  section.subsections.forEach(function (subsection) {
    subsection.elements.forEach(function (el) {
      el.modifiers.forEach(function (modifier) {
        refSection = section.section + '.' + subsection.subsection;
        selector = el.tag + el.class + modifier;
        name = refSection + '--' + selector;
        selector = uniqueSelector(refSection, selector);
        capture(selector, name);
      });
    });

    // some elements are only visible after an action
    if (subsection.hidden_elements) {
      subsection.hidden_elements.forEach(function (el) {
        el.modifiers.forEach(function (modifier) {
          refSection = section.section + '.' + subsection.subsection;
          selector = el.tag + el.class + modifier;
          name = refSection + '--' + selector;
          selector = uniqueSelector(refSection, selector);
          actionSelector = el.action_element
          actionSelector = uniqueSelector(refSection, actionSelector);
          actThenCapture(el.action, actionSelector, selector, name);
        });
      });
    }
  });
});

// End tests and compare screenshots
casper.then(function() {
    phantomcss.compareAll();
})
.then(function() {
    casper.test.done();
})
.run(function() {
    phantom.exit();
});
