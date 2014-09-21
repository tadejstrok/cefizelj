// initialise variables
var animating = false;

var tree;

var basenode;
var currentnode;
var breadcrumbs = [];

// repaint screen
function repaintMe() {
    
    $('.container').width($(window).width()).height($(window).height());
    
    $('.item').not('.stretched, .shrunk').each(function(i, e) {
        $(e).height($(e).parent().height() / $(e).parent().children('.item').length);
    });
    $('.stretched').each(function(i, e) {
        $(e).height($(e).parent().height());
    });
}

// repaint rightr
function repaintRightr() {
    $('.half-rightr .item').each(function(i, e) {
        $(e).height($(e).parent().height() / $(e).parent().children('.item').length);
    });
}

// api tree getter
function getTree(callback) {
    console.log('hi, I am about to fetch the tree.');
    $.getJSON('http://cefizeljapi.djnd.si/node/tree', function(r) {
        
        tree = r;
        
        callback();
    });
}

// generate first node
function generateFirstNode() {
    for (var node in basenode['items']) {
        $('.half-right')
            .append(itemHTML
                    .replace('{{ id }}', node)
                    .replace('{{ itemcontent }}', basenode['items'][node]['name'])
            );
    }
    
    repaintMe();
}

// move left and cleanup (next)
function moveLeftStupid() {
    $('.half-left').animate({
        'margin-left': '-50%'
    }, 500, function() {
        
        // cleanup
        $('.half-leftr').removeClass('half-leftr'); // remove hidden left
        
        // update classes
        $('.half-left').removeClass('half-left').addClass('half-leftr'); // left -> leftr
        $('.half-right').removeClass('half-right').addClass('half-left'); // right -> left
        $('.half-rightr').removeClass('half-rightr').addClass('half-right').next().addClass('half-rightr').removeClass('half-right'); // rightr -> right, next -> rightr
        
        // stop animating
        animating = false;
        
    });
}

// startapp
function startapp() {
    
    // time to hide the spinner
    $('.spinner').hide();
    
    console.log('rendering now');
    
    // set basenode and currentnode
    basenode = tree['tree'][0];
    currentnode = basenode;
    
    generateFirstNode();
    
}

// move right
function moveRight() {
    
    // move right
    $('.half-leftr').animate({
        'margin-left': '0%'
    }, 500, function() {
        //cleanup
        
        $('.half-right').remove();
        
        $('.half-left')
            .removeClass('half-left')
            .addClass('half-right')
            .children('h1')
                .removeClass('bck')
                .addClass('fwd');
        
        $('.half-leftr')
            .removeClass('half-leftr')
            .addClass('half-left')
            .prev()
                .addClass('half-leftr');
        
        animating = false;
        
    });
    
    currentnode = basenode;
    breadcrumbs.splice(breadcrumbs.length - 1, 1);
    for (var breadcrumb in breadcrumbs) {
        currentnode = currentnode['items'][breadcrumbs[breadcrumb]];
    }
    
}

// render next half
function renderNext(targetnode) {
    
    if (targetnode['items'][0]['type'] == 'menu') { // check if next node is a menu
        
        var items = targetnode['items']
        
        // render list
        $('.half-right')
            .after(createListHalf('<div class="half half-rightr">', items));
    
    } else {
        
        // render content TODO
        alert('content');
//        $('.half-right')
//            .after(createContentHalf('<div class=half half-rightr">', target['content']));
        
    }
    
    // repaint after done rendering
    repaintRightr();
}

// render and display next half
function displayNextHalfAPI(target) {
    
    breadcrumbs[breadcrumbs.length] = target;
    
    renderNext(currentnode['items'][target]);
    
    currentnode = currentnode['items'][target];
    
    moveLeftStupid();
    
}

// create list half
function createListHalf(firstdiv, items) {
    var result = firstdiv;
    
    $.each(items, function(i, e) {
        result = result + itemHTML
                            .replace('{{ itemcontent }}', e['name'])
                            .replace('{{ id }}', i)
                            .replace('{{ itemsubtitle }}', ''); // add subtitle TODO
    });
    
    result = result + '</div>';
    
    return result;
}

// stretch item
function stretchItem(item) {
    item
        .addClass('stretched')
        .animate({
            height: item.parent().height()
        }, 300);
    item
        .siblings()
            .addClass('shrunk')
            .animate({
                height: 0
            }, 300);
}

// shrink item
function shrinkItem(item) {
    
    item.animate({
        height : item.parent().height() / item.parent().children('.item').length
    }, 300);
    
    item.siblings().each(function(i, e) {
        $(e).animate({
            height : $(e).parent().height() / $(e).parent().children('.item').length
        }, 300);
    });
}

$(document).ready(function() {
    
    // first, repaint
    repaintMe();
    
    // get tree and start app
    getTree(startapp);
    
    // set onresize events
    window.onresize = function() {
        repaintMe();
    }
    
    // set event for mobile back
    $('.container').on('click', '.nazajcontainer', function() {
        
        moveRight();
        
        $(this)
            .parents('.half')
                .prev()
                    .children('.item-red')
                        .removeClass('item-red') // previous selected remove red
                        .children('.centermevertically') // toggle fwd/bck
                            .children('h1')
                            .toggleClass('fwd')
                            .toggleClass('bck');
    });
    
    // set item events
    $('.container').on('click', '.item', function() { // on clicking item
        
        // if not animating
        if (!animating) {
            
            // set animating to true
            animating = true;
            
            // if it's the right-hand side
            if ($(this).parent().hasClass('half-right')) {

                // make item selected
                $(this).addClass('item-red');
                
                // stretchItem
                stretchItem($(this));
                
                var _this = $(this)
                window.setTimeout(function() {
                
                    // display next half
                    displayNextHalfAPI(_this.data('id'));
                
                }, 300);
            
            // the click happened on the left-hand side
            } else if ($(this).parent().hasClass('half-left')) {
                
                // change text from nazaj to whatever it's supposed to be
                $(this)
                    .removeClass('stretched')
                    .children('.centermevertically')
                    .children('h1')
                        .text($(this)
                                .children('.centermevertically')
                                    .children('h1')
                                    .data('text')
                             );
                
                $(this)
                    .siblings()
                        .removeClass('shrunk');

                // remove class red from clicked element
                $(this).removeClass('item-red');

                moveRight();
                var _this = $(this);
                window.setTimeout(function() {

                    // shrink item
                    shrinkItem(_this);

                }, 400);
                    
            } // end of left-right if

            // switch fwd/bck classes
            $(this)
                .children('.centermevertically')
                    .children('h1')
                        .toggleClass('fwd')
                        .toggleClass('bck');
        }
    });
    
    // set item-red hover events TODO CAN BE OPTIMISED
    $('.container').on({
        'mouseenter': function() {
            
            $(this)
                .children('.centermevertically')
                    .children('h1')
                    .data('text', $(this) // save text for later
                                    .children('.centermevertically')
                                        .children('h1')
                                            .text()
                         )
                    .text('nazaj'); // set text to nazaj
        }, 
        'mouseleave': function() {
            $(this)
                .children('.centermevertically')
                .children('h1')
                .text($(this)
                        .children('.centermevertically')
                            .children('h1')
                                .data('text'));
        }
    }, '.item-red');

    // set tab events TODO
    $('.container').on('click', '.tab', function() {
        if (!$(this).hasClass('open')) {
            $(this).siblings().toggleClass('open');
            $(this).toggleClass('open');

            $(this).parent().next().children('div').toggleClass('open');
        }
    });
    
    // confirm cookies
    $('#confirmcookies').on('click', function() {
        
        updateConsent();
        
        $('.cookiewarning').animateRotate(-720, 600);
        
        $('.cookiewarning').animate({
            'top': -150,
            'left': -150,
        }, 600);
    });

    // get cookie info
    $('#getinfoaboutcookies').on('click', function() {
        window.open('http://danesjenovdan.si/piskotki/'); // TODO
    }); 
    
});
