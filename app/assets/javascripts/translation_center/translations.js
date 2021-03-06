// Place all the behaviors and hooks related to the matching controller here.
// All this logic will automatically be available in application.js.

$(document).ready(function() {

  editableTranslations();
  editableKeyTranslations();

  $(document).on('click', '.accept_translation', function(){
    $.ajax({
      type: 'POST',
      url: Routes.translation_center_translation_accept_path($(this).attr('data-translation-id')) + '.js'
    });
  });

  $(document).on('click', '.unaccept_translation', function(){
    $.ajax({
      type: 'POST',
      url: Routes.translation_center_translation_unaccept_path($(this).attr('data-translation-id')) + '.js'
    });
  });

  $(document).on('click', '.sort_by_votes', function(){
    $.ajax({
      type: 'GET',
      url: Routes.translation_center_translation_key_translations_path($(this).attr('data-key-id')) + '.js',
      data: {sort_by: 'votes'}
    });
  });

  $(document).on('click', '.translations_tab, .sort_by_date', function(){
    $.ajax({
      type: 'GET',
      url: Routes.translation_center_translation_key_translations_path($(this).attr('data-key-id')) + '.js'
    });
  });
  
  $(document).on('mouseover', '.translations_vote',
    function() {
      $(this).addClass('badge-success');
  });

  $(document).on('mouseout', '.translations_vote',
    function() {
      if($(this).attr('voted') == 'false')
        $(this).removeClass('badge-success');
    }
  );

  $(document).on('click', '.translations_vote', function() {
    // vote
    if($(this).attr('voted') == 'false')
    {
      $(this).addClass('badge-success');
      $(this).attr('voted', 'true')
      // TODO use I18n.t
      $(this).text('Unvote');
      $.ajax({
        type: 'POST',
        url: Routes.translation_center_translation_vote_path($(this).attr('data-translation-id')) + '.js'
      });
     

    }
    // unvote
    else
    {
      $(this).removeClass('badge-success');
      $(this).attr('voted', 'false') 
      // TODO use I18n.t
      $(this).text('Vote');
      $.ajax({
        type: 'POST',
        url: Routes.translation_center_translation_unvote_path($(this).attr('data-translation-id')) + '.js'
      });
    }
  });

});

function moveToNextKey(key_id){
  var translation_key = $('li.translation_key[data-key-id=' + key_id + ']')
  var translations_listing = $('.tab-pane#' + translation_key.attr('data-key-id'));
  translations_listing.removeClass('active');
  translation_key.fadeOut();
  var next_key = translation_key.next();
  next_key.addClass('active');
  next_key.effect("highlight", {}, 3000);
  $('.tab-pane#' + next_key.attr('data-key-id')).addClass('active');
}

// given id of the key get the current status
function getKeyStatus(id){
  var classes = $('.translation_key[data-key-id=' + id + ']').children('.translation_key_badge').attr('class');
  if(classes.indexOf('badge-important') > 0)
    return 'untranslated'
  else if(classes.indexOf('badge-warning') > 0)
    return 'pending'
  else
    return 'translated'

}

// decrements the filter
function decrementFilter(filter){
  if(filter == 'untranslated')
    decrementUntranslated();
  else if(filter == 'translated')
    decrementTranslated();
  else
    decrementPending();
  decrementAll();
}

function decrementUntranslated(){
  var count = parseInt($('#untranslated_keys_count').text().replace('(', '').replace(')', '')) - 1;
  $('#untranslated_keys_count').text('(' + count +  ')');
}

function decrementTranslated(){
  var count = parseInt($('#translated_keys_count').text().replace('(', '').replace(')', '')) - 1;
  $('#translated_keys_count').text('(' + count +  ')');
}

function decrementPending(){
  var count = parseInt($('#pending_keys_count').text().replace('(', '').replace(')', '')) - 1;
  $('#pending_keys_count').text('(' + count +  ')');
  
}

function incrementUntranslated(){
  var count = parseInt($('#untranslated_keys_count').text().replace('(', '').replace(')', '')) + 1;
  $('#untranslated_keys_count').text('(' + count +  ')');
}

function incrementTranslated(){
  var count = parseInt($('#translated_keys_count').text().replace('(', '').replace(')', '')) + 1;
  $('#translated_keys_count').text('(' + count +  ')');
}

function incrementPending(){
  var count = parseInt($('#pending_keys_count').text().replace('(', '').replace(')', '')) + 1;
  $('#pending_keys_count').text('(' + count +  ')');
}

function incrementAll(){
  var count = parseInt($('#all_keys_count_count').text().replace('(', '').replace(')', '')) + 1;
  $('#all_keys_count_count').text('(' + count +  ')');
}

function decrementAll(){
  var count = parseInt($('#all_keys_count_count').text().replace('(', '').replace(')', '')) - 1;
  $('#all_keys_count_count').text('(' + count +  ')');
}



function editableTranslations(){

  $.each($('.user_translation'), function(){
    var key_id = $(this).attr('data-key-id');

    $(this).editable(Routes.translation_center_translation_key_update_translation_path(key_id, {format: 'json'}), {
      method: 'POST',
      onblur : 'submit',
      // TODO use I18n.t for translations
      placeholder : 'click to add or edit your translation',
      tooltip     : 'click to add or edit your translation',
      callback : function(data, settings) {
        data = $.parseJSON(data);
        
        
        $(this).text(data.value);
        if(Filter.key() == 'untranslated')
        {
          decrementUntranslated();
          // if normal user then moved to pending
          if(data.status == 'pending')
            incrementPending();
          else
            // admin then move to translated
            incrementTranslated();
          moveToNextKey($(this).attr('data-key-id'));
        }
        else if(Filter.key() == 'pending')
        {
          // if you are an admin and your edits are considered accepted
          if(data.status == 'accepted')
          {
            decrementPending();
            incrementTranslated();
          }
          moveToNextKey($(this).attr('data-key-id')); 
        }
        else if(Filter.key() == 'all')
        {
          eval('increment' + capitaliseFirstLetter(data.status))()
          eval('decrement' + capitaliseFirstLetter(data.key_before_status))()
          // change status of translation
          if(data.status == 'pending')
          {
            $('li.translation_key[data-key-id=' + key_id + ']').children('div').removeClass('badge-important').addClass('badge-warning');
          }
          else
          {
            $('li.translation_key[data-key-id=' + key_id + ']').children('div').removeClass('badge-important').addClass('badge-success');
          }
        }
      }

      
    });

    $(this).text($.trim($(this).text()));
  });

}

function editableKeyTranslations(){

  $.each($('.key_editable'), function(){
    var key_id = $(this).attr('data-key-id');

    $(this).editable(Routes.translation_center_translation_key_path(key_id, {format: 'json'}), {
      method: 'PUT',
      onblur : 'submit',
      // TODO use I18n.t for translations
      tooltip     : 'Click to edit translation key',
      callback : function(data, settings) {
        data = $.parseJSON(data);
        $(this).text(data.new_value);

        // if category changed then fade out the key
        if(data.new_category != data.old_category)
        {
          moveToNextKey(data.key_id);
          decrementFilter(getKeyStatus(data.key_id));
        }

      }


    });
    $(this).text($.trim($(this).text()));

  });

}