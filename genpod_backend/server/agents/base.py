# genpod_backend/server/agents/base.py

from abc import ABC, abstractmethod

class AgentBase(ABC):
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def run(self, task: str, context: dict) -> str:
        """
        Each agent must implement this method to do its job.

        Args:
            task (str): The task assigned to this agent.
            context (dict): Shared information between agents (optional).

        Returns:
            str: The agent's response or result.
        """
        pass