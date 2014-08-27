/// <reference path="../bower_components/jquery/jquery.js" />
/// <reference path="../bower_components/bootstrap/dist/js/bootstrap.js" />
/// <reference path="../bower_components/jStorage/jstorage.js" />
/// <reference path="../bower_components/raphael/raphael.js" />

var Game = {};

Game.Load = function (user_id, user_score_level) {
    var game = {};
    game.user_id = user_id;
    $.jStorage.set("userid", user_id);
    $.jStorage.set("user_score_level", user_score_level);
    console.log('user saved!');


            
    function loadGame() {
                
    }

    function saveGame(score, math_syntax, answer, correct) {
        console.log('saving score :' + score);
        var request = {};
        request["userid"] = $.jStorage.get("userid");
        request["math_syntax"] = math_syntax;
        request["answer"] = answer;
        request["correct"] = correct;
        request["score"] = score;

        $.post('/game/score', request, function (result) {
            console.log(result);
        });
    }

    function addToTotal(score) {
        // was : total_score
        var total_score = new Number($.jStorage.get("user_score_level"));
        $.jStorage.set("user_score_level", total_score + score);
        var request = {};
        request.userid = $.jStorage.get("userid");
        request.user_level_score = total_score + score;

        $.post("/game/updatelevelscore", request, function () {
            console.log('level score saved');
        });
    }

    function generateMathProblem() {
        // reset view 
        $('#_question_next').removeClass('hidden');
        $('#answer').val("");
        var total_score = new Number($.jStorage.get("user_score_level"));
        $('#_question_title').html("Question " + total_score + 1);
        var _x = randomNumber(50) + 1;
        var _y = randomNumber(10) + 1;


        var _operator = "+";

        var _op = randomNumber(100) + 1;
        console.log("random op was " + _op);
        if (_op >= 0 && _op <= 25) {
            _operator = "-";
        }

        if (_op >= 26 && _op <= 50) {
            _operator = "*";
        }

        if (_op >= 51 && _op <= 75) {
            _operator = "-";
        }

        if (_op >= 76) {
            _operator = "+";
        }



        $('#_op_1').text(_x);
        $('#_op_2').text(_y);
        $('#_op_operator').text(_operator);


        math_problem = _x.toString() + '' + _operator + '' + _y.toString();
        console.log(math_problem);
        $('#_question_text').attr('data-math-syntax', math_problem);
    }

    function randomNumber(max) {
        return Math.floor(Math.random() * max);
    }

    function gradeMathProblem() {
        $('#_question_next').addClass('hidden');
        var correct = false;
        var answer = $('#answer').val();
        var math_syntax = $('#_question_text').attr('data-math-syntax');
        var score = new Number($('#_question_score_').attr('data-current-score'));

        // State Reporting 
        //console.log('the math problem :  ' + math_syntax);
       // console.log('the current score is ' + score);


        if (answer == (eval(math_syntax))) {
            //console.log('correct');
            score = score + 1;
            saveGame(score, math_syntax, answer,true);

            $('#results').addClass("alert-success");
            var $_next = $('<a class="btn" style="font-size:larger">Next Question</a>');
            $_next.on('click', function () {
                $('#results').empty();
                activateRow('#question_row');
            });

            $('#results').html("Correct!");
            $('#results').append($_next);

            var $indicator = $('<i class="fa fa-check-circle-o fa-4x" style="color:#C0FC29"></i>');
            $('#_question_score_').append($indicator);
            $('#_question_score_').attr('data-current-score', score);
            correct = true;
            if (score == 5) {
                addToTotal(score);
                $('#_question_score_').attr('data-current-score', '0');
                $('#_question_score_').empty();
                activateRow('#level_row');
            }
            $indicator.addClass('slideExpandUp');
        }
        else {
            $('#results').addClass("alert-danger");
            $('#results').html("Incorrect!");
            $('#_question_next').removeClass('hidden');
            saveGame(score, math_syntax, answer, false);
        }

    }

    function activateRow(selector, question_path) {
        $('.view-row').fadeOut();
        $('.view-row').addClass('hidden');

        if (selector == "#question_row") {
            $('#results').removeClass('alert');
            $('#results').removeClass('alert-successful');
            $('#results').removeClass('alert-danger');
            $('#results').empty();
            generateMathProblem();
        }

        if (selector == "#level_row") {
            var total_score = $.jStorage.get("user_score_level");
          
            $('.cell').each(function (ele) {
                console.log($(this).attr('id'));
                var q_index = $(this).attr('id').replace('q_', '');

                if (q_index <= (total_score / 5)) {
                    $(this).removeClass('cell-locked');
                    $(this).removeClass('fa-lock');
                    $(this).addClass('cell-unlocked');
                    $(this).addClass('fa-star');

                    if ($(this).attr('data-last-step')) {
                        // Do something big! ! ! ! 
                        $('div[data-level="' + $(this).attr('data-level') + '"]').addClass('pulse');
                    }
                }
            });
        }

        $(selector).fadeIn();
        $(selector).removeClass('hidden');
    }

    $('.cell').mouseenter(function () {
        $(this).removeClass('cell-state-normal');
        $(this).addClass('cell-state-hover');
    });

    $('.cell').mouseleave(function () {
        $(this).removeClass('cell-state-hover');
        $(this).addClass('cell-state-normal');
    });

    $('.cell').on('click', function () {
        var question_path = $(this).attr('id');
        var can_be_enabled = false;

        var current = '#' + question_path;
        var prev = '#q_' + (question_path.replace('q_', '') - 1);

        console.log('You clicked ' + current);
        console.log('The step before was ' + prev);
        console.log('Was the previous step enabled? ' + $(prev).hasClass('fa-star'));

        if ($(prev).hasClass('fa-star')) {
            can_be_enabled = true;
            console.log('Its good!');
            activateRow('#question_row');
        }

        if (question_path == "q_1") {
            can_be_enabled = true;
        }

        // Show Completed ?
        if (can_be_enabled) {
            $(this).removeClass('cell-locked');
            $(this).removeClass('fa-lock');
            $(this).addClass('cell-unlocked');
            $(this).addClass('fa-star');

            if ($(this).attr('data-last-step')) {
                // Do something big! ! ! ! 
                $('div[data-level="' + $(this).attr('data-level') + '"]').addClass('pulse');
            }

            console.log(question_path);
        }

        //activateRow("#question_row", question_path);
    });

    $('#loading_row').fadeOut('slow', function () {
        activateRow('#question_row');
    });

    $('#_question_next').on('click', function () {
        gradeMathProblem();
    });

    $('.cell-locked').addClass('fa fa-lock fa-3x');


    return game;
};