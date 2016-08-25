'use babel';

import { CompositeDisposable } from 'atom'
import request from 'request';
import cheerio from 'cheerio';
import google from 'google';
google.resultsPerPage = 1

export default {

  subscriptions: null,

  activate() {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'sourcefetch:fetch': () => this.fetch()
    }))
  },

  deactivate() {
    this.subscriptions.dispose()
  },
  search(query,language){
    return new Promise((resolve,reject) => {
        let searchString =`${query} in ${language} site:stackoverflow.com`
      google(searchString,(err,res) => {
        if(err){
          atom.notifications.addWarning(err.reason)
          reject({
            reason: 'Error occured during search!'
          })
        }
        else if(res.links.length == 0){
          reject({
            reason: 'No Results found!'
          })
        }
        else{
          resolve(res.links[0].href)
        }
      })
    })
  }
  ,
  scrape(html){
    $ = cheerio.load(html)
    return $('div.accepted-answer pre code').text()
  },

  fetch() {
    let editor
    let self = this
    if (editor = atom.workspace.getActiveTextEditor()) {
      let language = editor.getGrammar().name
      let query = editor.getSelectedText()

      self.search(query,language).then((url) => {
         atom.notifications.addSuccess('Found google results!')
         return self.download(url)
      }).then((html) => {
          let answer = self.scrape(html)
          if(answer === ''){
            atom.notifications.addWarning('No answer found :(. Use your own Brain!')
          }
          else{
            editor.insertText(answer)
          }
        }).catch((error) => {
          atom.notifications.addWarning(error.reason)
        })
      }
    },

  download(url){
    return new Promise((resolve,reject) => {
      request(url,(error,response,body) => {
        if(!error && response.statusCode == 200){
          resolve(body)
        }
        else{
          reject({
          reason: 'Unable to download page!!'
        })
        }
      })
    })
  }
};
