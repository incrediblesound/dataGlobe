//make into object that keeps track of friends and can give you "next friend"
var nextFunc = {
  last: '',
  friends: '',
  init: function(friends){
    this.friends = friends;
  },
  nextFriend: function(){
    var i = Math.floor(Math.random()*this.friends.length);
    current = this.friends[i];
    currentNode = drawing.getNode(current);
    while(!currentNode || current === this.last){
      i += 1;
      if(i === this.friends.length){
        i = 0;
      }
      current = this.friends[i];
      currentNode = drawing.getNode(current);
    }
    //go to next user on globe and draw mutual friends
    window.currentId = current
    this.last = current;
    drawing.goToNode(current);
    getPic(current);
    goToRelay(current);
    postExplosion(current);
  }
}

var flyToNext = function(){
  $.get('/api/get-user').then(function(response){
      nextFunc.init(JSON.parse(response).friends);
  })
};
// TODO: Brilliant but hurts everyone's brains James


var getAllPhotos = function(id){
  id = id || window.currentId;
  if(current === undefined){
    var current = window.currentId;
  }
  FBData.get('userPhotos',current, function(data){
    //get photos of current friend
    data = JSON.parse(data);
    if(data.photos){
      //if there are photos, display them
      getPhotos(data.photos.data, id);
    }
  })
};

var getPhotos = function (array, id){
  var friend = drawing.getNode(id);
  if(array.length){
    setInterval(function(){
      if(array.length){
        var current = array.pop();
        FBData.get('getPhoto', current.id, function(photoData){
          photoData = JSON.parse(photoData);
          drawing.displayPhoto(photoData, friend);
        })
      }
    }, 20)
  }
};

var postExplosion = function(id){
    FBData.get('newsFeed', id, function(data){
      var myPosts = JSON.parse(data);
      if(myPosts.posts){
        myPosts = myPosts.posts.data;
        investigatePosts(id, myPosts);
      }
    })
};

var investigatePosts = function(id, posts){
  drawing.moveOut();
  if(!posts || !posts.length){
    return;
  } else {
    if(posts.length > 12){
      posts = posts.slice(0,12);
    }
    console.log(posts);
    // TODO: if condition for clearing interval
    setInterval(function(){
      if(posts.length){
        drawPosts(id, posts.pop());
      }
    }, 300)
  }
}

var drawPosts = function(id, current){
  current = drawing.addPost(id, current, drawing);
  FBData.getPostLikes(current.id, function(data){
    data = data.data;
    for(var l = 0; l < data.length; l++){
      var liker = data[l];
      liker = drawing.getNode(liker.id);
      if(drawing.getNode(liker.id) !== undefined){
        drawing.addEdge(current.id, liker.id, 'green', true);
      }
    }
  })
}
// TODO: unused as FB API v1.0 doesn't allow this call to be batched
// var batchPhotos = function(idArray){
//   var dataArray = [];
//   if(idArray.length){
//     idArray.forEach(function(id){
//       dataArray.push({method: 'GET', relative_url: '/'+id});
//     })
//   }
//   FBData.batch(dataArray, function(data){
//     console.log(data);
//   })
// };

// TODO: separate keyboard UI into separate controller. note: a couple hours to implement
$(document).on('keydown', function( event ){
  if(event.which === 32){ // space key
    nextFunc.nextFriend();
  }
  // else if(event.which === 13){ // enter key
  //   getAllPhotos();
  // }
  // else if(event.which === 87){ // w key
  //   var current = window.currentId
  //   FBData.get('newsFeed', current, function(data){
  //     var myPosts = JSON.parse(data);
  //     if(myPosts.posts){
  //       myPosts = myPosts.posts.data;
  //       investigatePosts(current, myPosts);
  //     }
  //   })
  // }
})

var infoHTMLlog = [];
var $infoHTML = $('<div><div class="info-data img-box"></div></div>');

// TODO: name change. displayProfilePic?
function displayInfo(data, isUrl){
  var key;
  if(isUrl){
    key = data.url;
  } else {
    key = data.source;
  }
  //TODO: Cache these variables
  var $infoHTMLClone = $infoHTML.clone();
  var $info = $infoHTMLClone.find('.info-data');

  if($('.panel-wrapper').children().length){
    $($('.panel-wrapper').children()[0]).addClass('zoomOut');
  }
  $('.panel-wrapper').empty();
  var image = new Image();
  image.style.opacity = 0.6;
  image.onload = function(){
    var $image = $(image);
    $image.addClass('info-img animated zoomIn');
    $info.append($image);
    $('.panel-wrapper').append($infoHTMLClone);
    infoHTMLlog.push($infoHTMLClone);
  }
  image.src = key;
};

var getPic = function(id){
  FBData.get('getProfilePic', id, function(photo){
    photo = JSON.parse(photo);
    photo = photo.picture.data;
    displayInfo(photo, true);
  })
}

var goToRelay = function(id){
  if(id === id){
    window.currentId = id;
  }
  //drawing.goToNode(id);
  getAllPhotos(id);
  getMutual(id);
}

var getMutual = function(idArray, connectUser){
  if(connectUser && drawing !== undefined){
    var node = drawing.getNode(idArray);
    if(!node){
      console.log("node not found");
    } else {
      drawing.connectToUser(node);
    }
  }
  if(Array.isArray(idArray)){
    var currentFriend = idArray.pop();
  } else {
    var currentFriend = idArray;
    idArray = [];
  }
  var payload = {id: currentFriend};
  $.post('/api/get-mutual', payload).then(function(response){
    var mutualList = JSON.parse(response);
    if(mutualList.length){
      loadMutual(mutualList, currentFriend);
    }
  })
  if(idArray.length){
      return getMutual(idArray);
  } else {
      return;
  }
}
//this is a relic of a previous iteration
var loadMutual = function(list, currentFriend){
  var currentMutual = list.pop();
  drawing.addEdge(currentFriend, currentMutual, 'red', true);
  if(list.length){
    return loadMutual(list, currentFriend);
  } else {
    return;
  }
}
