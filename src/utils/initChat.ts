import { v4 as uuidv4 } from 'uuid'

export function getInitChat() {
  return {
    id: uuidv4(),
    qnaList: [],
  }
}
