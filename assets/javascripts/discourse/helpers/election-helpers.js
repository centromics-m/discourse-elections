import { helper } from '@ember/component/helper';
import { formatTime } from '../lib/election';
import Handlebars from 'handlebars';

export default helper(function electionTime([time]) {
  return new Handlebars.SafeString(formatTime(time));
});


// import { registerUnbound } from 'discourse-common/lib/helpers';
// import { formatTime } from '../lib/election';

// export default registerUnbound('election-time', function(time) {
//   return new Handlebars.SafeString(formatTime(time));
// });
